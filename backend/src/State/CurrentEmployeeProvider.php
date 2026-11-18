<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Employee;
use App\Entity\User;
use App\Repository\EmployeeRepository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Provides the employee profile linked to the logged-in account (GET /api/me/employee).
 * Returning null makes API Platform answer 404 when no profile is linked.
 *
 * @implements ProviderInterface<Employee>
 */
final class CurrentEmployeeProvider implements ProviderInterface
{
    public function __construct(
        private readonly Security $security,
        private readonly EmployeeRepository $employeeRepository,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?Employee
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return null;
        }

        return $this->employeeRepository->findOneBy(['user' => $user]);
    }
}
