<?php

declare(strict_types=1);

namespace App\Tests\Unit\Security;

use App\Entity\Establishment;
use App\Entity\Position;
use App\Entity\User;
use App\Enum\Role;
use App\Security\PositionVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Authorization\Voter\VoterInterface;

/**
 * Unit tests: the rule alone, without database nor HTTP request.
 */
final class PositionVoterTest extends TestCase
{
    private Establishment $bistrot;
    private Position $kitchen;
    private Position $floor;

    protected function setUp(): void
    {
        $this->bistrot = new Establishment('Le Bistrot');
        $this->kitchen = $this->position('Cuisine', $this->bistrot);
        $this->floor = $this->position('Salle', $this->bistrot);
    }

    public function testAnAdminManagesEveryPositionOfTheirEstablishment(): void
    {
        $admin = $this->user(Role::Admin, $this->bistrot);

        self::assertSame(VoterInterface::ACCESS_GRANTED, $this->vote($admin, $this->kitchen));
        self::assertSame(VoterInterface::ACCESS_GRANTED, $this->vote($admin, $this->floor));
    }

    public function testAnAdminDoesNotManageThePositionsOfAnotherEstablishment(): void
    {
        $admin = $this->user(Role::Admin, new Establishment('La Brasserie'));

        self::assertSame(VoterInterface::ACCESS_DENIED, $this->vote($admin, $this->kitchen));
    }

    public function testAManagerManagesTheirOwnPositions(): void
    {
        $manager = $this->user(Role::Manager, $this->bistrot);
        $manager->addManagedPosition($this->kitchen);

        self::assertSame(VoterInterface::ACCESS_GRANTED, $this->vote($manager, $this->kitchen));
    }

    public function testAManagerDoesNotManageOtherPositions(): void
    {
        $manager = $this->user(Role::Manager, $this->bistrot);
        $manager->addManagedPosition($this->kitchen);

        self::assertSame(VoterInterface::ACCESS_DENIED, $this->vote($manager, $this->floor));
    }

    public function testAnEmployeeManagesNoPosition(): void
    {
        $employee = $this->user(Role::Employee, $this->bistrot);

        self::assertSame(VoterInterface::ACCESS_DENIED, $this->vote($employee, $this->kitchen));
    }

    public function testOtherAttributesAreIgnored(): void
    {
        $admin = $this->user(Role::Admin, $this->bistrot);
        $token = new UsernamePasswordToken($admin, 'main', $admin->getRoles());

        self::assertSame(VoterInterface::ACCESS_ABSTAIN, (new PositionVoter())->vote($token, $this->kitchen, ['POSITION_DELETE']));
    }

    private function vote(User $user, Position $position): int
    {
        $token = new UsernamePasswordToken($user, 'main', $user->getRoles());

        return (new PositionVoter())->vote($token, $position, [PositionVoter::MANAGE]);
    }

    private function user(Role $role, Establishment $establishment): User
    {
        return new User(strtolower($role->name).'@servio.test', 'Léa', 'Martin', $role, $establishment);
    }

    private function position(string $name, Establishment $establishment): Position
    {
        $position = new Position($name, '#c46a45');
        $position->setEstablishment($establishment);

        return $position;
    }
}
