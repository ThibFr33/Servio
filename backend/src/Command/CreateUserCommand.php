<?php

declare(strict_types=1);

namespace App\Command;

use App\Enum\Role;
use App\Exception\InvalidUserDataException;
use App\Service\User\UserCreator;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Console front-end for UserCreator: it only asks the questions and displays the result.
 */
#[AsCommand(name: 'app:user:create', description: 'Create a user account')]
final class CreateUserCommand
{
    public function __construct(private readonly UserCreator $userCreator)
    {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Argument('Email address, used to log in')] string $email,
        #[Argument('First name')] string $firstName,
        #[Argument('Last name')] string $lastName,
        #[Option('Name of the establishment, created if it does not exist')] string $establishment = 'Servio',
        #[Option('Role: employee, manager or admin')] string $role = 'employee',
    ): int {
        $userRole = Role::tryFrom('ROLE_'.strtoupper($role));
        if (null === $userRole) {
            $io->error('Unknown role. Use employee, manager or admin.');

            return Command::INVALID;
        }

        $password = (string) $io->askHidden(\sprintf('Password (hidden, at least %d characters)', UserCreator::MIN_PASSWORD_LENGTH));
        if ($password !== (string) $io->askHidden('Confirm the password')) {
            $io->error('The passwords do not match.');

            return Command::INVALID;
        }

        try {
            $user = $this->userCreator->create($email, $firstName, $lastName, $userRole, $establishment, $password);
        } catch (InvalidUserDataException $exception) {
            $io->error($exception->getErrors());

            return Command::INVALID;
        }

        $io->success(\sprintf('User %s created with role %s.', $user->getEmail(), $userRole->value));

        return Command::SUCCESS;
    }
}
