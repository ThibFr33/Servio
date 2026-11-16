<?php

declare(strict_types=1);

namespace App\Security;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Employee;
use App\Entity\User;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Every API query on employees only sees the logged-in user's establishment.
 * An employee from another establishment is therefore simply not found (404).
 */
final class EmployeeEstablishmentExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(private readonly Security $security)
    {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $this->restrictToCurrentEstablishment($queryBuilder, $queryNameGenerator, $resourceClass);
    }

    public function applyToItem(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, array $identifiers, ?Operation $operation = null, array $context = []): void
    {
        $this->restrictToCurrentEstablishment($queryBuilder, $queryNameGenerator, $resourceClass);
    }

    private function restrictToCurrentEstablishment(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass): void
    {
        if (Employee::class !== $resourceClass) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];
        $user = $this->security->getUser();

        // Refuse by default: without a known user, nothing is returned.
        if (!$user instanceof User) {
            $queryBuilder->andWhere('1 = 0');

            return;
        }

        // Ids are stored as BINARY(16): the parameter must be typed as a UUID.
        $parameter = $queryNameGenerator->generateParameterName('establishment');
        $queryBuilder
            ->andWhere(\sprintf('%s.establishment = :%s', $rootAlias, $parameter))
            ->setParameter($parameter, $user->getEstablishment()->getId(), UuidType::NAME);
    }
}
