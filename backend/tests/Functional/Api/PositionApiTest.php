<?php

declare(strict_types=1);

namespace App\Tests\Functional\Api;

use App\Entity\Establishment;
use App\Entity\Position;
use App\Entity\User;
use App\Enum\Role;
use App\State\PositionDeleteProcessor;
use App\Tests\Factory\EmployeeFactory;
use App\Tests\Factory\PositionFactory;
use App\Tests\Factory\UserFactory;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class PositionApiTest extends WebTestCase
{
    use ApiRequestTrait;

    private EntityManagerInterface $entityManager;
    private UserFactory $users;
    private PositionFactory $positions;
    private Establishment $bistrot;
    private Establishment $brasserie;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->entityManager = $container->get(EntityManagerInterface::class);
        $this->users = new UserFactory($this->entityManager, $container->get(UserPasswordHasherInterface::class));
        $this->positions = new PositionFactory($this->entityManager);

        $this->bistrot = new Establishment('Le Bistrot');
        $this->brasserie = new Establishment('La Brasserie');
        $this->entityManager->persist($this->bistrot);
        $this->entityManager->persist($this->brasserie);
        $this->entityManager->flush();
    }

    public function testEmployeeOnlySeesThePositionsOfTheirEstablishment(): void
    {
        $this->positions->create($this->bistrot, 'Cuisine');
        $this->positions->create($this->bistrot, 'Salle');
        $this->positions->create($this->brasserie, 'Bar');
        $this->logInAs(Role::Employee);

        $this->send('GET', '/api/positions');

        self::assertResponseIsSuccessful();
        $names = array_column($this->members(), 'name');
        sort($names);
        self::assertSame(['Cuisine', 'Salle'], $names);
    }

    public function testVisitorCannotListPositions(): void
    {
        $this->send('GET', '/api/positions');

        self::assertResponseStatusCodeSame(401);
    }

    public function testAdminCreatesAPositionInTheirOwnEstablishment(): void
    {
        $this->logInAs(Role::Admin);

        $this->send('POST', '/api/positions', ['name' => 'Plonge', 'color' => '#534ab7']);

        self::assertResponseStatusCodeSame(201);
        $data = $this->responseData();
        self::assertSame('Plonge', $data['name']);
        self::assertSame('#534ab7', $data['color']);
        self::assertArrayNotHasKey('establishment', $data);
        self::assertSame($this->bistrot->getId()->toRfc4122(), $this->findPosition('Plonge')->getEstablishment()->getId()->toRfc4122());
    }

    #[DataProvider('nonAdminRoles')]
    public function testOnlyAnAdminCanCreateAPosition(Role $role): void
    {
        $this->logInAs($role);

        $this->send('POST', '/api/positions', ['name' => 'Plonge', 'color' => '#534ab7']);

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

    /**
     * @param array<string, string> $payload
     */
    #[DataProvider('invalidPayloads')]
    public function testInvalidDataIsRejected(array $payload): void
    {
        $this->logInAs(Role::Admin);

        $this->send('POST', '/api/positions', $payload);

        self::assertResponseStatusCodeSame(422);
    }

    /**
     * @return iterable<string, array{array<string, string>}>
     */
    public static function invalidPayloads(): iterable
    {
        yield 'blank name' => [['name' => '', 'color' => '#534ab7']];
        yield 'name too long' => [['name' => str_repeat('a', Position::NAME_MAX_LENGTH + 1), 'color' => '#534ab7']];
        yield 'colour without #' => [['name' => 'Plonge', 'color' => '534ab7']];
        yield 'colour not hexadecimal' => [['name' => 'Plonge', 'color' => '#zzzzzz']];
    }

    public function testANameAlreadyUsedInTheEstablishmentIsRejected(): void
    {
        $this->positions->create($this->bistrot, 'Cuisine');
        $this->logInAs(Role::Admin);

        $this->send('POST', '/api/positions', ['name' => 'Cuisine', 'color' => '#534ab7']);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('Un poste porte déjà ce nom.', $this->responseData()['violations'][0]['message']);
    }

    public function testTheSameNameIsAllowedInAnotherEstablishment(): void
    {
        $this->positions->create($this->brasserie, 'Cuisine');
        $this->logInAs(Role::Admin);

        $this->send('POST', '/api/positions', ['name' => 'Cuisine', 'color' => '#534ab7']);

        self::assertResponseStatusCodeSame(201);
    }

    public function testAnEstablishmentSentInThePayloadIsIgnored(): void
    {
        $this->logInAs(Role::Admin);

        $this->send('POST', '/api/positions', [
            'name' => 'Plonge',
            'color' => '#534ab7',
            'establishment' => '/api/establishments/'.$this->brasserie->getId()->toRfc4122(),
        ]);

        self::assertResponseStatusCodeSame(201);
        self::assertSame($this->bistrot->getId()->toRfc4122(), $this->findPosition('Plonge')->getEstablishment()->getId()->toRfc4122());
    }

    public function testAPositionOfAnotherEstablishmentIsNotFound(): void
    {
        $bar = $this->positions->create($this->brasserie, 'Bar');
        $this->logInAs(Role::Employee);

        $this->send('GET', $this->iri($bar));

        self::assertResponseStatusCodeSame(404);
    }

    public function testAdminUpdatesAPosition(): void
    {
        $kitchen = $this->positions->create($this->bistrot, 'Cuisine');
        $this->logInAs(Role::Admin);

        $this->send('PATCH', $this->iri($kitchen), ['color' => '#2e8c74']);

        self::assertResponseIsSuccessful();
        self::assertSame('#2e8c74', $this->responseData()['color']);
    }

    public function testAdminDeletesAPosition(): void
    {
        $kitchen = $this->positions->create($this->bistrot, 'Cuisine');
        $this->logInAs(Role::Admin);

        $this->send('DELETE', $this->iri($kitchen));

        self::assertResponseStatusCodeSame(204);
        self::assertNull($this->entityManager->getRepository(Position::class)->findOneBy(['name' => 'Cuisine']));
    }

    public function testAPositionGivenToEmployeesCannotBeDeleted(): void
    {
        $kitchen = $this->positions->create($this->bistrot, 'Cuisine');
        (new EmployeeFactory($this->entityManager))->create($kitchen);
        $this->logInAs(Role::Admin);

        $this->send('DELETE', $this->iri($kitchen));

        self::assertResponseStatusCodeSame(409);
        self::assertStringContainsString(PositionDeleteProcessor::POSITION_IN_USE_MESSAGE, (string) $this->client->getResponse()->getContent());
        self::assertNotNull($this->entityManager->getRepository(Position::class)->findOneBy(['name' => 'Cuisine']));
    }

    #[DataProvider('writeMethods')]
    public function testAdminCannotChangeAPositionOfAnotherEstablishment(string $method): void
    {
        $bar = $this->positions->create($this->brasserie, 'Bar');
        $this->logInAs(Role::Admin);

        $this->send($method, $this->iri($bar), 'PATCH' === $method ? ['color' => '#000000'] : null);

        self::assertResponseStatusCodeSame(404);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function writeMethods(): iterable
    {
        yield 'update' => ['PATCH'];
        yield 'delete' => ['DELETE'];
    }

    private function logInAs(Role $role): User
    {
        $user = $this->users->create(strtolower($role->name).'@servio.test', $role, establishment: $this->bistrot);
        $this->client->loginUser($user);

        return $user;
    }

    private function iri(Position $position): string
    {
        return '/api/positions/'.$position->getId()->toRfc4122();
    }

    private function findPosition(string $name): Position
    {
        $this->entityManager->clear();
        $position = $this->entityManager->getRepository(Position::class)->findOneBy(['name' => $name]);
        self::assertNotNull($position);

        return $position;
    }
}
