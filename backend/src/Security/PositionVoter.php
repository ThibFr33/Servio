<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\Position;
use App\Entity\User;
use App\Enum\Role;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * "Does this user manage this position?" — the central rule of the access table:
 * an admin manages every position of their establishment, a manager only the
 * positions assigned to them, an employee none.
 *
 * @extends Voter<string, Position>
 */
final class PositionVoter extends Voter
{
    public const MANAGE = 'POSITION_MANAGE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::MANAGE === $attribute && $subject instanceof Position;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        if (!$user->getEstablishment()->getId()->equals($subject->getEstablishment()->getId())) {
            return false;
        }

        return match ($user->getRole()) {
            Role::Admin => true,
            Role::Manager => $user->managesPosition($subject),
            Role::Employee => false,
        };
    }
}
