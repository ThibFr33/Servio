<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Position;
use App\Repository\EmployeeRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * A position still given to employees cannot be deleted: it would leave them
 * without a position. The foreign key in the database is the last safety net.
 *
 * @implements ProcessorInterface<Position, null>
 */
final class PositionDeleteProcessor implements ProcessorInterface
{
    public const POSITION_IN_USE_MESSAGE = 'Ce poste est encore attribué à des employés.';

    /**
     * @param ProcessorInterface<Position, null> $removeProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.remove_processor')]
        private readonly ProcessorInterface $removeProcessor,
        private readonly EmployeeRepository $employeeRepository,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): null
    {
        if ($this->employeeRepository->isPositionUsed($data)) {
            throw new ConflictHttpException(self::POSITION_IN_USE_MESSAGE);
        }

        return $this->removeProcessor->process($data, $operation, $uriVariables, $context);
    }
}
