<?php

declare(strict_types=1);

namespace App\Tests\Functional\Security;

use App\Enum\Role;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Security\Core\Role\RoleHierarchyInterface;

final class RoleHierarchyTest extends KernelTestCase
{
    public function testAdminInheritsManagerAndEmployeeRoles(): void
    {
        self::assertSame(
            [Role::Admin->value, Role::Manager->value, Role::Employee->value],
            $this->reachableRoles(Role::Admin),
        );
    }

    public function testManagerInheritsEmployeeRoleOnly(): void
    {
        self::assertSame([Role::Manager->value, Role::Employee->value], $this->reachableRoles(Role::Manager));
    }

    public function testEmployeeHasNoInheritedRole(): void
    {
        self::assertSame([Role::Employee->value], $this->reachableRoles(Role::Employee));
    }

    /**
     * @return list<string>
     */
    private function reachableRoles(Role $role): array
    {
        $hierarchy = static::getContainer()->get(RoleHierarchyInterface::class);

        return array_values($hierarchy->getReachableRoleNames([$role->value]));
    }
}
