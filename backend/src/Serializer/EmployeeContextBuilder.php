<?php

declare(strict_types=1);

namespace App\Serializer;

use ApiPlatform\State\SerializerContextBuilderInterface;
use App\Entity\Employee;
use Symfony\Component\DependencyInjection\Attribute\AsDecorator;
use Symfony\Component\DependencyInjection\Attribute\AutowireDecorated;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

/**
 * Contract details (contract type, weekly hours, hiring date) are only sent to admins:
 * everyone else sees a colleague's name and position, which the planning needs.
 * Managers will get them for their own positions once positions are assigned to them.
 */
#[AsDecorator('api_platform.serializer.context_builder')]
final class EmployeeContextBuilder implements SerializerContextBuilderInterface
{
    public function __construct(
        #[AutowireDecorated]
        private readonly SerializerContextBuilderInterface $decorated,
        private readonly AuthorizationCheckerInterface $authorizationChecker,
    ) {
    }

    public function createFromRequest(Request $request, bool $normalization, ?array $extractedAttributes = null): array
    {
        $context = $this->decorated->createFromRequest($request, $normalization, $extractedAttributes);

        if ($normalization
            && Employee::class === ($context['resource_class'] ?? null)
            && $this->authorizationChecker->isGranted('ROLE_ADMIN')
        ) {
            $context['groups'][] = Employee::GROUP_READ_CONTRACT;
        }

        return $context;
    }
}
