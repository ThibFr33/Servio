<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\PositionRepository;
use App\State\PositionDeleteProcessor;
use App\State\PositionProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A job in the restaurant (kitchen, floor, dishwashing…). Its colour is used in the planning.
 * Reads are limited to the user's establishment by PositionEstablishmentExtension.
 */
#[ORM\Entity(repositoryClass: PositionRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_POSITION_ESTABLISHMENT_NAME', fields: ['establishment', 'name'])]
#[UniqueEntity(fields: ['establishment', 'name'], message: 'Un poste porte déjà ce nom.', errorPath: 'name')]
#[ApiResource(
    // Api platforme génère toutes les routes pour l'entité Position
    operations: [
        new GetCollection(security: "is_granted('ROLE_EMPLOYEE')"),
        new Get(security: "is_granted('ROLE_EMPLOYEE')"),
        new Post(security: "is_granted('ROLE_ADMIN')", processor: PositionProcessor::class),
        new Patch(security: "is_granted('ROLE_ADMIN')"),
        new Delete(security: "is_granted('ROLE_ADMIN')", processor: PositionDeleteProcessor::class),
    ],
    normalizationContext: ['groups' => ['position:read']],
    denormalizationContext: ['groups' => ['position:write']],
)]
class Position
{
    public const NAME_MAX_LENGTH = 50;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['position:read'])]
    private Uuid $id;

    #[ORM\Column(length: self::NAME_MAX_LENGTH)]
    #[Assert\NotBlank(message: 'Le nom du poste est obligatoire.')]
    #[Assert\Length(max: self::NAME_MAX_LENGTH, maxMessage: 'Le nom du poste ne doit pas dépasser {{ limit }} caractères.')]
    #[Groups(['position:read', 'position:write'])]
    private string $name;

    #[ORM\Column(length: 7)]
    #[Assert\NotBlank(message: 'La couleur est obligatoire.')]
    #[Assert\Regex(pattern: '/^#[0-9a-fA-F]{6}$/', message: 'La couleur doit être au format #RRGGBB.')]
    #[Groups(['position:read', 'position:write'])]
    private string $color;

    /**
     * Never read nor written through the API: set by PositionProcessor from the logged-in user.
     */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private Establishment $establishment;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(string $name, string $color)
    {
        $this->id = Uuid::v7();
        $this->name = $name;
        $this->color = $color;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getColor(): string
    {
        return $this->color;
    }

    public function setColor(string $color): static
    {
        $this->color = $color;

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
