<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\Establishment;
use App\Entity\Position;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Creates positions in the test database (rolled back after each test).
 */
final class PositionFactory
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function create(Establishment $establishment, string $name = 'Cuisine', string $color = '#c46a45'): Position
    {
        $position = new Position($name, $color);
        $position->setEstablishment($establishment);

        $this->entityManager->persist($position);
        $this->entityManager->flush();

        return $position;
    }
}
