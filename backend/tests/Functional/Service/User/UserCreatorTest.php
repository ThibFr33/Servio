<?php

declare(strict_types=1);

namespace App\Tests\Functional\Service\User;

use App\Entity\User;
use App\Enum\Role;
use App\Exception\InvalidUserDataException;
use App\Repository\EstablishmentRepository;
use App\Service\User\UserCreator;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserCreatorTest extends KernelTestCase
{
    private const VALID_PASSWORD = 'a-long-enough-password';

    private UserCreator $userCreator;

    protected function setUp(): void
    {
        $this->userCreator = static::getContainer()->get(UserCreator::class);
    }

    public function testCreatesAUserWithAHashedPassword(): void
    {
        $user = $this->createUser('lea@servio.test');

        self::assertSame('lea@servio.test', $user->getEmail());
        self::assertSame(Role::Manager, $user->getRole());
        self::assertTrue($user->isActive());
        self::assertNotSame(self::VALID_PASSWORD, $user->getPassword());
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        self::assertTrue($hasher->isPasswordValid($user, self::VALID_PASSWORD));
    }

    public function testRejectsAPasswordShorterThanTheMinimum(): void
    {
        $this->expectException(InvalidUserDataException::class);

        $this->createUser('lea@servio.test', password: 'too-short');
    }

    public function testRejectsAnEmailAlreadyInUse(): void
    {
        $this->createUser('lea@servio.test');

        $exception = $this->captureFailure(fn () => $this->createUser('lea@servio.test'));

        self::assertStringStartsWith('email:', $exception->getErrors()[0]);
    }

    public function testRejectsAnInvalidEmail(): void
    {
        $exception = $this->captureFailure(fn () => $this->createUser('not-an-email'));

        self::assertStringStartsWith('email:', $exception->getErrors()[0]);
    }

    public function testReusesAnExistingEstablishment(): void
    {
        $first = $this->createUser('lea@servio.test');
        $second = $this->createUser('karim@servio.test');

        self::assertSame($first->getEstablishment(), $second->getEstablishment());
        $repository = static::getContainer()->get(EstablishmentRepository::class);
        self::assertCount(1, $repository->findBy(['name' => 'Le Bistrot']));
    }

    private function createUser(string $email, string $password = self::VALID_PASSWORD): User
    {
        return $this->userCreator->create($email, 'Léa', 'Martin', Role::Manager, 'Le Bistrot', $password);
    }

    private function captureFailure(callable $action): InvalidUserDataException
    {
        try {
            $action();
        } catch (InvalidUserDataException $exception) {
            return $exception;
        }

        self::fail('An InvalidUserDataException was expected.');
    }
}
