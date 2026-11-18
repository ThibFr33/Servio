<?php

declare(strict_types=1);

namespace App\Tests\Functional\Api;

use App\Entity\Employee;
use App\Entity\Establishment;
use App\Entity\Position;
use App\Entity\User;
use App\Enum\Role;
use App\Tests\Factory\EmployeeFactory;
use App\Tests\Factory\PositionFactory;
use App\Tests\Factory\UserFactory;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class EmployeeApiTest extends WebTestCase
{
    use ApiRequestTrait;

    private const CONTRACT_FIELDS = ['contractType', 'weeklyMinutes', 'hiredAt'];

    private EntityManagerInterface $entityManager;
    private UserFactory $users;
    private EmployeeFactory $employees;
    private Establishment $bistrot;
    private Establishment $brasserie;
    private Position $kitchen;
    private Position $bar;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->entityManager = $container->get(EntityManagerInterface::class);
        $this->users = new UserFactory($this->entityManager, $container->get(UserPasswordHasherInterface::class));
        $this->employees = new EmployeeFactory($this->entityManager);

        $this->bistrot = new Establishment('Le Bistrot');
        $this->brasserie = new Establishment('La Brasserie');
        $this->entityManager->persist($this->bistrot);
        $this->entityManager->persist($this->brasserie);
        $this->entityManager->flush();

        $positions = new PositionFactory($this->entityManager);
        $this->kitchen = $positions->create($this->bistrot, 'Cuisine');
        $this->bar = $positions->create($this->brasserie, 'Bar');
    }

    public function testEmployeeSeesColleaguesOfTheirEstablishmentWithoutContractDetails(): void
    {
        $this->employees->create($this->kitchen, 'Karim');
        $this->employees->create($this->kitchen, 'Hugo');
        $this->employees->create($this->bar, 'Inès');
        $this->logInAs(Role::Employee);

        $this->send('GET', '/api/employees');

        self::assertResponseIsSuccessful();
        $members = $this->members();
        $firstNames = array_column($members, 'firstName');
        sort($firstNames);
        self::assertSame(['Hugo', 'Karim'], $firstNames);
        foreach (self::CONTRACT_FIELDS as $field) {
            self::assertArrayNotHasKey($field, $members[0]);
        }
        self::assertSame($this->positionIri($this->kitchen), $members[0]['position']);
    }

    public function testAdminSeesContractDetails(): void
    {
        $this->employees->create($this->kitchen, 'Karim');
        $this->logInAs(Role::Admin);

        $this->send('GET', '/api/employees');

        self::assertResponseIsSuccessful();
        $karim = $this->members()[0];
        self::assertSame('cdi', $karim['contractType']);
        self::assertSame(35 * 60, $karim['weeklyMinutes']);
        self::assertSame('2025-03-01', $karim['hiredAt']);
    }

    public function testVisitorCannotListEmployees(): void
    {
        $this->send('GET', '/api/employees');

        self::assertResponseStatusCodeSame(401);
    }

    public function testAdminCreatesAnEmployeeInTheirOwnEstablishment(): void
    {
        $this->logInAs(Role::Admin);

        $this->send('POST', '/api/employees', $this->validPayload());

        self::assertResponseStatusCodeSame(201);
        $data = $this->responseData();
        self::assertSame('Sarah', $data['firstName']);
        self::assertTrue($data['active']);
        self::assertArrayNotHasKey('establishment', $data);
        self::assertArrayNotHasKey('user', $data);
        self::assertSame($this->bistrot->getId()->toRfc4122(), $this->findEmployee('Sarah')->getEstablishment()->getId()->toRfc4122());
    }

    #[DataProvider('nonAdminRoles')]
    public function testOnlyAnAdminCanCreateAnEmployee(Role $role): void
    {
        $this->logInAs($role);

        $this->send('POST', '/api/employees', $this->validPayload());

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
     * @param array<string, mixed> $changes
     */
    #[DataProvider('invalidChanges')]
    public function testInvalidDataIsRejected(array $changes): void
    {
        $this->logInAs(Role::Admin);

        $this->send('POST', '/api/employees', array_merge($this->validPayload(), $changes));

        self::assertResponseStatusCodeSame(422);
    }

    /**
     * @return iterable<string, array{array<string, mixed>}>
     */
    public static function invalidChanges(): iterable
    {
        yield 'blank first name' => [['firstName' => '']];
        yield 'unknown contract type' => [['contractType' => 'freelance']];
        yield 'negative weekly minutes' => [['weeklyMinutes' => -60]];
        yield 'weekly minutes above the maximum' => [['weeklyMinutes' => Employee::MAX_WEEKLY_MINUTES + 1]];
        yield 'missing hiring date' => [['hiredAt' => null]];
        yield 'missing position' => [['position' => null]];
    }

    public function testAPositionOfAnotherEstablishmentIsRejected(): void
    {
        $this->logInAs(Role::Admin);

        $this->send('POST', '/api/employees', array_merge($this->validPayload(), ['position' => $this->positionIri($this->bar)]));

        // The IRI is resolved through PositionEstablishmentExtension, which does not find it:
        // the error is reported on the position field.
        self::assertResponseStatusCodeSame(422);
        self::assertSame('position', $this->responseData()['violations'][0]['propertyPath']);
    }

    public function testAnEstablishmentSentInThePayloadIsIgnored(): void
    {
        $this->logInAs(Role::Admin);

        $this->send('POST', '/api/employees', array_merge($this->validPayload(), [
            'establishment' => '/api/establishments/'.$this->brasserie->getId()->toRfc4122(),
        ]));

        self::assertResponseStatusCodeSame(201);
        self::assertSame($this->bistrot->getId()->toRfc4122(), $this->findEmployee('Sarah')->getEstablishment()->getId()->toRfc4122());
    }

    #[DataProvider('readAndUpdate')]
    public function testAnEmployeeOfAnotherEstablishmentIsNotFound(string $method): void
    {
        $ines = $this->employees->create($this->bar, 'Inès');
        $this->logInAs(Role::Admin);

        $this->send($method, $this->employeeIri($ines), 'PATCH' === $method ? ['active' => false] : null);

        self::assertResponseStatusCodeSame(404);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function readAndUpdate(): iterable
    {
        yield 'read' => ['GET'];
        yield 'update' => ['PATCH'];
    }

    public function testAdminDeactivatesAnEmployee(): void
    {
        $karim = $this->employees->create($this->kitchen, 'Karim');
        $this->logInAs(Role::Admin);

        $this->send('PATCH', $this->employeeIri($karim), ['active' => false]);

        self::assertResponseIsSuccessful();
        self::assertFalse($this->responseData()['active']);
        self::assertFalse($this->findEmployee('Karim')->isActive());
    }

    public function testAnEmployeeCannotBeDeleted(): void
    {
        $karim = $this->employees->create($this->kitchen, 'Karim');
        $this->logInAs(Role::Admin);

        $this->send('DELETE', $this->employeeIri($karim));

        self::assertResponseStatusCodeSame(405);
        $this->findEmployee('Karim');
    }

    public function testManagerSeesContractDetailsOnlyForTheirPositions(): void
    {
        $floor = (new PositionFactory($this->entityManager))->create($this->bistrot, 'Salle');
        $this->employees->create($this->kitchen, 'Karim');
        $this->employees->create($floor, 'Sarah');
        $manager = $this->logInAs(Role::Manager);
        $manager->addManagedPosition($this->kitchen);
        $this->entityManager->flush();

        $this->send('GET', '/api/employees');

        self::assertResponseIsSuccessful();
        $byFirstName = array_column($this->members(), null, 'firstName');
        self::assertSame('cdi', $byFirstName['Karim']['contractType']);
        self::assertArrayNotHasKey('contractType', $byFirstName['Sarah']);
    }

    public function testEmployeeSeesTheirOwnContractOnly(): void
    {
        $hugo = $this->logInAs(Role::Employee);
        $this->linkAccount($this->employees->create($this->kitchen, 'Hugo'), $hugo);
        $this->employees->create($this->kitchen, 'Karim');

        $this->send('GET', '/api/employees');

        self::assertResponseIsSuccessful();
        $byFirstName = array_column($this->members(), null, 'firstName');
        self::assertSame(35 * 60, $byFirstName['Hugo']['weeklyMinutes']);
        self::assertArrayNotHasKey('weeklyMinutes', $byFirstName['Karim']);
        self::assertArrayNotHasKey('user', $byFirstName['Hugo']);
    }

    public function testAdminLinksAnAccountToAnEmployee(): void
    {
        $karim = $this->employees->create($this->kitchen, 'Karim');
        $account = $this->users->create('karim@servio.test', Role::Employee, establishment: $this->bistrot);
        $this->logInAs(Role::Admin);

        $this->send('PATCH', $this->employeeIri($karim), ['user' => $this->userIri($account)]);

        self::assertResponseIsSuccessful();
        self::assertSame($this->userIri($account), $this->responseData()['user']);
    }

    public function testOnlyAnAdminCanLinkAnAccount(): void
    {
        $karim = $this->employees->create($this->kitchen, 'Karim');
        $account = $this->users->create('karim@servio.test', Role::Employee, establishment: $this->bistrot);
        $manager = $this->logInAs(Role::Manager);
        $manager->addManagedPosition($this->kitchen);
        $this->entityManager->flush();

        $this->send('PATCH', $this->employeeIri($karim), ['user' => $this->userIri($account)]);

        self::assertResponseStatusCodeSame(403);
    }

    public function testAnAccountOfAnotherEstablishmentCannotBeLinked(): void
    {
        $karim = $this->employees->create($this->kitchen, 'Karim');
        $stranger = $this->users->create('ines@brasserie.test', Role::Employee, establishment: $this->brasserie);
        $this->logInAs(Role::Admin);

        $this->send('PATCH', $this->employeeIri($karim), ['user' => $this->userIri($stranger)]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('user', $this->responseData()['violations'][0]['propertyPath']);
    }

    public function testAnAccountAlreadyLinkedToAnotherEmployeeIsRejected(): void
    {
        $account = $this->users->create('karim@servio.test', Role::Employee, establishment: $this->bistrot);
        $this->linkAccount($this->employees->create($this->kitchen, 'Karim'), $account);
        $hugo = $this->employees->create($this->kitchen, 'Hugo');
        $this->logInAs(Role::Admin);

        $this->send('PATCH', $this->employeeIri($hugo), ['user' => $this->userIri($account)]);

        self::assertResponseStatusCodeSame(422);
        self::assertSame('Ce compte est déjà rattaché à une autre fiche.', $this->responseData()['violations'][0]['message']);
    }

    public function testCurrentEmployeeIsReturnedWithTheirContract(): void
    {
        $hugo = $this->logInAs(Role::Employee);
        $this->linkAccount($this->employees->create($this->kitchen, 'Hugo'), $hugo);

        $this->send('GET', '/api/me/employee');

        self::assertResponseIsSuccessful();
        $data = $this->responseData();
        self::assertSame('Hugo', $data['firstName']);
        self::assertSame('cdi', $data['contractType']);
        self::assertSame('2025-03-01', $data['hiredAt']);
    }

    public function testCurrentEmployeeIsNotFoundWhenNoProfileIsLinked(): void
    {
        $this->logInAs(Role::Employee);

        $this->send('GET', '/api/me/employee');

        self::assertResponseStatusCodeSame(404);
    }

    private function logInAs(Role $role): User
    {
        $user = $this->users->create(strtolower($role->name).'@servio.test', $role, establishment: $this->bistrot);
        $this->client->loginUser($user);

        return $user;
    }

    private function linkAccount(Employee $employee, User $account): void
    {
        $employee->setUser($account);
        $this->entityManager->flush();
    }

    private function userIri(User $user): string
    {
        return '/api/users/'.$user->getId()->toRfc4122();
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'firstName' => 'Sarah',
            'lastName' => 'Leroy',
            'position' => $this->positionIri($this->kitchen),
            'contractType' => 'cdd',
            'weeklyMinutes' => 24 * 60,
            'hiredAt' => '2026-09-01',
        ];
    }

    private function positionIri(Position $position): string
    {
        return '/api/positions/'.$position->getId()->toRfc4122();
    }

    private function employeeIri(Employee $employee): string
    {
        return '/api/employees/'.$employee->getId()->toRfc4122();
    }

    private function findEmployee(string $firstName): Employee
    {
        $this->entityManager->clear();
        $employee = $this->entityManager->getRepository(Employee::class)->findOneBy(['firstName' => $firstName]);
        self::assertNotNull($employee);

        return $employee;
    }
}
