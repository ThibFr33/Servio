<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Enum\Role;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/**
 * A login account. Exposed to admins only, to assign positions to managers:
 * the only field they can change through the API is managedPositions.
 * Reads are limited to the admin's establishment by UserEstablishmentExtension.
 */
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[UniqueEntity(fields: ['email'])]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_ADMIN')"),
        new Get(security: "is_granted('ROLE_ADMIN')"),
        new Patch(security: "is_granted('ROLE_ADMIN')"),
    ],
    normalizationContext: ['groups' => [self::GROUP_READ, self::GROUP_ADMIN_READ]],
    denormalizationContext: ['groups' => [self::GROUP_ADMIN_WRITE]],
    collectDenormalizationErrors: true,
)]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    // Sent to the user themself (/api/me) and to admins.
    public const GROUP_READ = 'user:read';
    public const GROUP_ADMIN_READ = 'user:admin:read';
    public const GROUP_ADMIN_WRITE = 'user:admin:write';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups([self::GROUP_READ])]
    private Uuid $id;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 180)]
    #[Groups([self::GROUP_READ])]
    private string $email;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    #[Groups([self::GROUP_READ])]
    private string $firstName;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    #[Groups([self::GROUP_READ])]
    private string $lastName;

    #[ORM\Column(length: 20, enumType: Role::class)]
    #[Groups([self::GROUP_ADMIN_READ])]
    private Role $role;

    /**
     * The hashed password, never the plain one.
     */
    #[ORM\Column]
    private string $password = '';

    #[ORM\Column]
    private bool $isActive = true;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private Establishment $establishment;

    /**
     * Positions whose planning and contracts this manager handles.
     *
     * @var Collection<int, Position>
     */
    #[ORM\ManyToMany(targetEntity: Position::class)]
    #[ORM\JoinTable(name: 'user_managed_position')]
    #[Groups([self::GROUP_ADMIN_READ, self::GROUP_ADMIN_WRITE])]
    private Collection $managedPositions;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        string $email,
        string $firstName,
        string $lastName,
        Role $role,
        Establishment $establishment,
    ) {
        $this->id = Uuid::v7();
        $this->email = $email;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->role = $role;
        $this->establishment = $establishment;
        $this->managedPositions = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
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

    public function getRole(): Role
    {
        return $this->role;
    }

    public function setRole(Role $role): static
    {
        $this->role = $role;

        return $this;
    }

    // Serialized as "active": the serializer strips the "is" prefix of the getter.
    #[Groups([self::GROUP_ADMIN_READ])]
    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function getEstablishment(): Establishment
    {
        return $this->establishment;
    }

    /**
     * @return Collection<int, Position>
     */
    public function getManagedPositions(): Collection
    {
        return $this->managedPositions;
    }

    public function addManagedPosition(Position $position): static
    {
        if (!$this->managedPositions->contains($position)) {
            $this->managedPositions->add($position);
        }

        return $this;
    }

    public function removeManagedPosition(Position $position): static
    {
        $this->managedPositions->removeElement($position);

        return $this;
    }

    public function managesPosition(Position $position): bool
    {
        foreach ($this->managedPositions as $managedPosition) {
            if ($managedPosition->getId()->equals($position->getId())) {
                return true;
            }
        }

        return false;
    }

    #[Assert\Callback]
    public function validateManagedPositions(ExecutionContextInterface $context): void
    {
        if (Role::Manager !== $this->role && !$this->managedPositions->isEmpty()) {
            $context->buildViolation('Seul un manager peut gérer des postes.')
                ->atPath('managedPositions')
                ->addViolation();
        }
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUserIdentifier(): string
    {
        if ('' === $this->email) {
            throw new \LogicException('A user must have an email address to be identified.');
        }

        return $this->email;
    }

    /**
     * Inherited roles (admin > manager > employee) come from the role hierarchy in security.yaml.
     *
     * @return list<string>
     */
    #[Groups([self::GROUP_READ])]
    public function getRoles(): array
    {
        return [$this->role->value];
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $hashedPassword): static
    {
        $this->password = $hashedPassword;

        return $this;
    }

    /**
     * Keeps the real password hash out of the session: only a CRC32C checksum is stored,
     * which is enough for Symfony to detect a password change (supported since Symfony 7.3).
     * The managed positions are left out too: Symfony reloads the user from the database
     * on every request, so the session only needs what identifies the account.
     *
     * @return array<string, mixed>
     */
    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0".self::class."\0password"] = hash('crc32c', $this->password);
        unset($data["\0".self::class."\0managedPositions"]);

        return $data;
    }

    #[\Deprecated]
    public function eraseCredentials(): void
    {
        // Required by UserInterface until Symfony 8; nothing to erase since no plain password is stored.
    }
}
