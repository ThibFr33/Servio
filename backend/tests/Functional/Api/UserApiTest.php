<?php

declare(strict_types=1);

namespace App\Tests\Functional\Api;

use App\Entity\Establishment;
use App\Entity\Position;
use App\Entity\User;
use App\Enum\Role;
use App\Tests\Factory\PositionFactory;
use App\Tests\Factory\UserFactory;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserApiTest extends WebTestCase
{
    use ApiRequestTrait;

    private EntityManagerInterface $entityManager;
    private UserFactory $users;
    private Establishment $bistrot;
    private Establishment $brasserie;
    private Position $kitchen;
    private Position $floor;
    private Position $bar;
    private User $admin;
    private User $manager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->entityManager = $container->get(EntityManagerInterface::class);
        $this->users = new UserFactory($this->entityManager, $container->get(UserPasswordHasherInterface::class));

        $this->bistrot = new Establishment('Le Bistrot');
        $this->brasserie = new Establishment('La Brasserie');
        $this->entityManager->persist($this->bistrot);
        $this->entityManager->persist($this->brasserie);
        $this->entityManager->flush();

        $positions = new PositionFactory($this->entityManager);
        $this->kitchen = $positions->create($this->bistrot, 'Cuisine');
        $this->floor = $positions->create($this->bistrot, 'Salle');
        $this->bar = $positions->create($this->brasserie, 'Bar');

        $this->admin = $this->users->create('admin@servio.test', Role::Admin, establishment: $this->bistrot);
        $this->manager = $this->users->create('manager@servio.test', Role::Manager, establishment: $this->bistrot);
    }

    public function testAdminListsTheAccountsOfTheirEstablishmentWithoutPasswords(): void
    {
        $this->users->create('ines@brasserie.test', Role::Admin, establishment: $this->brasserie);
        $this->client->loginUser($this->admin);

        $this->send('GET', '/api/users');

        self::assertResponseIsSuccessful();
        $members = $this->members();
        $emails = array_column($members, 'email');
        sort($emails);
        self::assertSame(['admin@servio.test', 'manager@servio.test'], $emails);
        foreach ($members as $member) {
            self::assertArrayNotHasKey('password', $member);
        }
    }

    public function testAnAccountOfAnotherEstablishmentIsNotFound(): void
    {
        $ines = $this->users->create('ines@brasserie.test', Role::Admin, establishment: $this->brasserie);
        $this->client->loginUser($this->admin);

        $this->send('GET', $this->userIri($ines));

        self::assertResponseStatusCodeSame(404);
    }

    public function testAdminAssignsPositionsToAManager(): void
    {
        $this->client->loginUser($this->admin);

        $this->send('PATCH', $this->userIri($this->manager), [
            'managedPositions' => [$this->positionIri($this->kitchen), $this->positionIri($this->floor)],
        ]);

        self::assertResponseIsSuccessful();
        $managedPositions = $this->responseData()['managedPositions'];
        self::assertIsArray($managedPositions);
        sort($managedPositions);
        $expected = [$this->positionIri($this->kitchen), $this->positionIri($this->floor)];
        sort($expected);
        self::assertSame($expected, $managedPositions);
    }

    #[DataProvider('nonAdminRoles')]
    public function testOnlyAnAdminCanChangeAnAccount(Role $role): void
    {
        $this->client->loginUser($this->users->create('someone@servio.test', $role, establishment: $this->bistrot));

        $this->send('PATCH', $this->userIri($this->manager), ['managedPositions' => [$this->positionIri($this->kitchen)]]);

        self::assertResponseStatusCodeSame(403);
    }

    /**
     * @return iterable<string, array{Role}>
     */
    public static function nonAdminRoles(): iterable
    {
        yield 'manager' => [Role::Manager];
        yield 'employee' => [Role::Employee];
    }

    public function testAPositionOfAnotherEstablishmentIsRejected(): void
    {
        $this->client->loginUser($this->admin);

        $this->send('PATCH', $this->userIri($this->manager), ['managedPositions' => [$this->positionIri($this->bar)]]);

        self::assertResponseStatusCodeSame(422);
        self::assertStringStartsWith('managedPositions', $this->responseData()['violations'][0]['propertyPath']);
    }

    public function testOnlyAManagerCanManagePositions(): void
    {
        $employee = $this->users->create('hugo@servio.test', Role::Employee, establishment: $this->bistrot);
        $this->client->loginUser($this->admin);

        $this->send('PATCH', $this->userIri($employee), ['managedPositions' => [$this->positionIri($this->kitchen)]]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('Seul un manager peut gérer des postes.', $this->responseData()['violations'][0]['message']);
    }

    public function testOtherFieldsCannotBeChanged(): void
    {
        $this->client->loginUser($this->admin);

        $this->send('PATCH', $this->userIri($this->manager), [
            'role' => 'ROLE_ADMIN',
            'email' => 'hacked@servio.test',
            'establishment' => '/api/establishments/'.$this->brasserie->getId()->toRfc4122(),
        ]);

        self::assertResponseIsSuccessful();
        $this->entityManager->clear();
        $manager = $this->entityManager->getRepository(User::class)->find($this->manager->getId());
        self::assertNotNull($manager);
        self::assertSame(Role::Manager, $manager->getRole());
        self::assertSame('manager@servio.test', $manager->getEmail());
        self::assertTrue($manager->getEstablishment()->getId()->equals($this->bistrot->getId()));
    }

    private function userIri(User $user): string
    {
        return '/api/users/'.$user->getId()->toRfc4122();
    }

    private function positionIri(Position $position): string
    {
        return '/api/positions/'.$position->getId()->toRfc4122();
    }
}
