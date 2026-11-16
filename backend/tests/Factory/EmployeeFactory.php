<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\Employee;
use App\Entity\Position;
use App\Enum\ContractType;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Creates employees in the test database (rolled back after each test).
 * The employee belongs to the establishment of their position.
 */
final class EmployeeFactory
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function create(Position $position, string $firstName = 'Karim', string $lastName = 'Benali'): Employee
    {
        $employee = new Employee($firstName, $lastName, $position, ContractType::Cdi, 35 * 60, new \DateTimeImmutable('2025-03-01'));
        $employee->setEstablishment($position->getEstablishment());

        $this->entityManager->persist($employee);
        $this->entityManager->flush();

        return $employee;
    }
}
