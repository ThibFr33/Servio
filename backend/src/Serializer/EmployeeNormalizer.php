<?php

declare(strict_types=1);

namespace App\Serializer;

use App\Entity\Employee;
use App\Entity\User;
use App\Security\PositionVoter;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareTrait;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

/**
 * Decides, employee by employee, which fields the logged-in user may see:
 * - contract details, for whoever manages the employee's position (see PositionVoter)
 *   and for the employee themself;
 * - the linked login account, for admins only.
 *
 * It only adds serialization groups, then hands the employee over to API Platform's normalizer.
 */
final class EmployeeNormalizer implements NormalizerInterface, NormalizerAwareInterface
{
    use NormalizerAwareTrait;

    // Marks an employee already handled, so the next normalizer in the chain is used instead of this one.
    private const ALREADY_CALLED = 'employee_normalizer_already_called';

    public function __construct(private readonly Security $security)
    {
    }

    /**
     * @param Employee $data
     */
    public function normalize(mixed $data, ?string $format = null, array $context = []): array|string|int|float|bool|\ArrayObject|null
    {
        $context[self::ALREADY_CALLED] = true;
        $groups = (array) ($context['groups'] ?? []);

        if ($this->canSeeContract($data)) {
            $groups[] = Employee::GROUP_READ_CONTRACT;
        }
        if ($this->security->isGranted('ROLE_ADMIN')) {
            $groups[] = Employee::GROUP_READ_ACCOUNT;
        }
        $context['groups'] = $groups;

        return $this->normalizer->normalize($data, $format, $context);
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Employee && !isset($context[self::ALREADY_CALLED]);
    }

    public function getSupportedTypes(?string $format): array
    {
        // Not cacheable: the answer depends on the context (already handled or not).
        return [Employee::class => false];
    }

    private function canSeeContract(Employee $employee): bool
    {
        $user = $this->security->getUser();
        $isOwnProfile = $user instanceof User && $employee->getUser()?->getId()->equals($user->getId());

        return $isOwnProfile || $this->security->isGranted(PositionVoter::MANAGE, $employee->getPosition());
    }
}
