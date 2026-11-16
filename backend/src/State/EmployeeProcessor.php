<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\ValidatorInterface;
use App\Entity\Employee;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * Creating an employee: the establishment always comes from the logged-in user,
 * never from the request.
 *
 * @implements ProcessorInterface<Employee, Employee>
 */
final class EmployeeProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<Employee, Employee> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly ValidatorInterface $validator,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Employee
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new AccessDeniedException();
        }

        $data->setEstablishment($user->getEstablishment());
        $this->validator->validate($data);

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
