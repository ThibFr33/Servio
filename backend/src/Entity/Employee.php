<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Enum\ContractType;
use App\Repository\EmployeeRepository;
use App\State\CurrentEmployeeProvider;
use App\State\EmployeeProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A member of the team, as shown in the planning. A login account is optional:
 * an extra who never uses the app can still be planned.
 *
 * Everyone can see a colleague's name and position; EmployeeNormalizer adds the
 * contract details for whoever manages the employee's position, and for the
 * employee themself. There is no DELETE: an employee who leaves is deactivated,
 * so past plannings keep their history.
 */
#[ORM\Entity(repositoryClass: EmployeeRepository::class)]
#[UniqueEntity(fields: ['user'], message: 'Ce compte est déjà rattaché à une autre fiche.', ignoreNull: true)]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_EMPLOYEE')"),
        new Get(security: "is_granted('ROLE_EMPLOYEE')"),
        new Get(
            uriTemplate: '/me/employee',
            uriVariables: [],
            security: "is_granted('ROLE_EMPLOYEE')",
            provider: CurrentEmployeeProvider::class,
            name: 'api_me_employee',
        ),
        new Post(security: "is_granted('ROLE_ADMIN')", processor: EmployeeProcessor::class),
        new Patch(security: "is_granted('ROLE_ADMIN')"),
    ],
    normalizationContext: ['groups' => [self::GROUP_READ]],
    denormalizationContext: ['groups' => [self::GROUP_WRITE]],
    // Type errors and missing fields become 422 violations, like any other invalid field.
    collectDenormalizationErrors: true,
)]
class Employee
{
    public const GROUP_READ = 'employee:read';
    public const GROUP_READ_CONTRACT = 'employee:read:contract';
    public const GROUP_READ_ACCOUNT = 'employee:read:account';
    public const GROUP_WRITE = 'employee:write';

    public const NAME_MAX_LENGTH = 100;
    // A sanity bound against typing mistakes, not a legal limit.
    public const MAX_WEEKLY_MINUTES = 60 * 60;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups([self::GROUP_READ])]
    private Uuid $id;

    #[ORM\Column(length: self::NAME_MAX_LENGTH)]
    #[Assert\NotBlank(message: 'Le prénom est obligatoire.')]
    #[Assert\Length(max: self::NAME_MAX_LENGTH, maxMessage: 'Le prénom ne doit pas dépasser {{ limit }} caractères.')]
    #[Groups([self::GROUP_READ, self::GROUP_WRITE])]
    private string $firstName;

    #[ORM\Column(length: self::NAME_MAX_LENGTH)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    #[Assert\Length(max: self::NAME_MAX_LENGTH, maxMessage: 'Le nom ne doit pas dépasser {{ limit }} caractères.')]
    #[Groups([self::GROUP_READ, self::GROUP_WRITE])]
    private string $lastName;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups([self::GROUP_READ, self::GROUP_WRITE])]
    private Position $position;

    #[ORM\Column(length: 20, enumType: ContractType::class)]
    #[Groups([self::GROUP_READ_CONTRACT, self::GROUP_WRITE])]
    private ContractType $contractType;

    #[ORM\Column]
    #[Assert\Range(
        notInRangeMessage: 'Les heures du contrat doivent être comprises entre {{ min }} et {{ max }} minutes.',
        min: 0,
        max: self::MAX_WEEKLY_MINUTES,
    )]
    #[Groups([self::GROUP_READ_CONTRACT, self::GROUP_WRITE])]
    private int $weeklyMinutes;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    #[Context([DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
    #[Groups([self::GROUP_READ_CONTRACT, self::GROUP_WRITE])]
    private \DateTimeImmutable $hiredAt;

    // Named "active" (not "isActive") so the API field matches the isActive() getter,
    // from which the serializer strips the "is" prefix.
    #[ORM\Column(name: 'is_active')]
    #[Groups([self::GROUP_READ, self::GROUP_WRITE])]
    private bool $active = true;

    /**
     * Optional login account, linked by an admin. Only admins see which account it is.
     */
    #[ORM\OneToOne]
    #[ORM\JoinColumn(nullable: true, unique: true)]
    #[Groups([self::GROUP_READ_ACCOUNT, self::GROUP_WRITE])]
    private ?User $user = null;

    /**
     * Never read nor written through the API: set by EmployeeProcessor from the logged-in user.
     */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private Establishment $establishment;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        string $firstName,
        string $lastName,
        Position $position,
        ContractType $contractType,
        int $weeklyMinutes,
        \DateTimeImmutable $hiredAt,
    ) {
        $this->id = Uuid::v7();
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->position = $position;
        $this->contractType = $contractType;
        $this->weeklyMinutes = $weeklyMinutes;
        $this->hiredAt = $hiredAt;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getPosition(): Position
    {
        return $this->position;
    }

    public function setPosition(Position $position): static
    {
        $this->position = $position;

        return $this;
    }

    public function getContractType(): ContractType
    {
        return $this->contractType;
    }

    public function setContractType(ContractType $contractType): static
    {
        $this->contractType = $contractType;

        return $this;
    }

    public function getWeeklyMinutes(): int
    {
        return $this->weeklyMinutes;
    }

    public function setWeeklyMinutes(int $weeklyMinutes): static
    {
        $this->weeklyMinutes = $weeklyMinutes;

        return $this;
    }

    public function getHiredAt(): \DateTimeImmutable
    {
        return $this->hiredAt;
    }

    public function setHiredAt(\DateTimeImmutable $hiredAt): static
    {
        $this->hiredAt = $hiredAt;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): static
    {
        $this->active = $active;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getEstablishment(): Establishment
    {
        return $this->establishment;
    }

    public function setEstablishment(Establishment $establishment): static
    {
        $this->establishment = $establishment;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
