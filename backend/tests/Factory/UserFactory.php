<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\Establishment;
use App\Entity\User;
use App\Enum\Role;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Creates users in the test database. Each test runs in a rolled back transaction,
 * so nothing created here survives the test.
 */
final class UserFactory
{
    public const PASSWORD = 'correct-horse-battery';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function create(
        string $email = 'lea@servio.test',
        Role $role = Role::Employee,
        bool $isActive = true,
    ): User {
        $establishment = new Establishment('Le Bistrot');
        $user = new User($email, 'Léa', 'Martin', $role, $establishment);
        $user->setPassword($this->passwordHasher->hashPassword($user, self::PASSWORD));
        $user->setIsActive($isActive);

        $this->entityManager->persist($establishment);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }
}
