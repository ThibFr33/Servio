<?php

declare(strict_types=1);

namespace App\Service\User;

use App\Entity\Establishment;
use App\Entity\User;
use App\Enum\Role;
use App\Exception\InvalidUserDataException;
use App\Repository\EstablishmentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Creates user accounts. There is no public sign-up: accounts come from the
 * console command today, and from the admin screens later.
 */
final class UserCreator
{
    public const MIN_PASSWORD_LENGTH = 12;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly EstablishmentRepository $establishmentRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly ValidatorInterface $validator,
    ) {
    }

    /**
     * @throws InvalidUserDataException when the password or the user data is invalid
     */
    public function create(
        string $email,
        string $firstName,
        string $lastName,
        Role $role,
        string $establishmentName,
        string $plainPassword,
    ): User {
        $this->assertValidPassword($plainPassword);

        $user = new User($email, $firstName, $lastName, $role, $this->findOrCreateEstablishment($establishmentName));
        $this->throwIfInvalid($this->validator->validate($user));

        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    private function assertValidPassword(string $plainPassword): void
    {
        $violations = $this->validator->validate($plainPassword, [
            new Assert\NotBlank(),
            new Assert\Length(min: self::MIN_PASSWORD_LENGTH),
        ]);

        if (\count($violations) > 0) {
            throw new InvalidUserDataException([\sprintf('password: The password must contain at least %d characters.', self::MIN_PASSWORD_LENGTH)]);
        }
    }

    private function throwIfInvalid(ConstraintViolationListInterface $violations): void
    {
        if (0 === \count($violations)) {
            return;
        }

        $errors = [];
        foreach ($violations as $violation) {
            $errors[] = \sprintf('%s: %s', $violation->getPropertyPath(), $violation->getMessage());
        }

        throw new InvalidUserDataException($errors);
    }

    private function findOrCreateEstablishment(string $name): Establishment
    {
        $establishment = $this->establishmentRepository->findOneBy(['name' => $name]);
        if (null === $establishment) {
            $establishment = new Establishment($name);
            $this->entityManager->persist($establishment);
        }

        return $establishment;
    }
}
