<?php

declare(strict_types=1);

$finder = (new PhpCsFixer\Finder())
    ->in(__DIR__)
    ->exclude('var')
    ->notPath([
        'config/bundles.php',
        'config/reference.php',
    ])
;

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(true)
    ->setRules([
        '@PSR12' => true,
        '@Symfony' => true,
        // Risky rules: they can change behaviour, which is exactly why we want them enforced.
        'declare_strict_types' => true,
        'strict_comparison' => true,
        'strict_param' => true,
    ])
    ->setFinder($finder)
;
