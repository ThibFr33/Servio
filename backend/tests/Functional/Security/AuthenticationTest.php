<?php

declare(strict_types=1);

namespace App\Tests\Functional\Security;

use App\Security\LoginFailureHandler;
use App\Tests\Factory\UserFactory;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AuthenticationTest extends WebTestCase
{
    private KernelBrowser $client;
    private UserFactory $users;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        // Keep the same kernel between requests, so the session and the login
        // throttling counters live through a whole scenario.
        $this->client->disableReboot();

        $container = static::getContainer();
        // Login throttling counters are stored in a cache pool: start each test from zero.
        $rateLimiterCache = $container->get('cache.rate_limiter');
        self::assertInstanceOf(CacheItemPoolInterface::class, $rateLimiterCache);
        $rateLimiterCache->clear();

        $this->users = new UserFactory(
            $container->get(EntityManagerInterface::class),
            $container->get(UserPasswordHasherInterface::class),
        );
    }

    public function testLoginWithValidCredentialsReturnsTheUser(): void
    {
        $this->users->create('lea@servio.test');

        $this->login('lea@servio.test', UserFactory::PASSWORD);

        self::assertResponseIsSuccessful();
        $data = $this->responseData();
        self::assertSame('lea@servio.test', $data['email']);
        self::assertSame(['ROLE_EMPLOYEE'], $data['roles']);
        self::assertArrayNotHasKey('password', $data);
    }

    public function testLoginWithWrongPasswordIsRejected(): void
    {
        $this->users->create('lea@servio.test');

        $this->login('lea@servio.test', 'wrong-password');

        self::assertResponseStatusCodeSame(401);
        self::assertSame(LoginFailureHandler::GENERIC_MESSAGE, $this->responseData()['error']);
    }

    public function testLoginWithUnknownEmailGivesTheSameMessage(): void
    {
        $this->login('nobody@servio.test', UserFactory::PASSWORD);

        self::assertResponseStatusCodeSame(401);
        self::assertSame(LoginFailureHandler::GENERIC_MESSAGE, $this->responseData()['error']);
    }

    public function testDisabledAccountCannotLogIn(): void
    {
        $this->users->create('lea@servio.test', isActive: false);

        $this->login('lea@servio.test', UserFactory::PASSWORD);

        self::assertResponseStatusCodeSame(401);
        self::assertSame(LoginFailureHandler::GENERIC_MESSAGE, $this->responseData()['error']);
    }

    public function testCurrentUserRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/me');

        self::assertResponseStatusCodeSame(401);
    }

    public function testCurrentUserIsReturnedAfterLogin(): void
    {
        $this->users->create('lea@servio.test');
        $this->login('lea@servio.test', UserFactory::PASSWORD);

        $this->client->request('GET', '/api/me');

        self::assertResponseIsSuccessful();
        $data = $this->responseData();
        self::assertSame('lea@servio.test', $data['email']);
        self::assertSame('Léa', $data['firstName']);
        self::assertArrayNotHasKey('password', $data);
    }

    public function testLogoutEndsTheSession(): void
    {
        $this->users->create('lea@servio.test');
        $this->login('lea@servio.test', UserFactory::PASSWORD);

        $this->client->request('POST', '/api/logout');
        self::assertResponseStatusCodeSame(204);

        $this->client->request('GET', '/api/me');
        self::assertResponseStatusCodeSame(401);
    }

    public function testTooManyFailedAttemptsAreThrottled(): void
    {
        $this->users->create('lea@servio.test');

        for ($attempt = 1; $attempt <= 5; ++$attempt) {
            $this->login('lea@servio.test', 'wrong-password');
            self::assertResponseStatusCodeSame(401);
        }

        $this->login('lea@servio.test', UserFactory::PASSWORD);

        self::assertResponseStatusCodeSame(429);
        self::assertSame(LoginFailureHandler::TOO_MANY_ATTEMPTS_MESSAGE, $this->responseData()['error']);
    }

    public function testPasswordIsStoredHashed(): void
    {
        $user = $this->users->create('lea@servio.test');

        self::assertNotSame(UserFactory::PASSWORD, $user->getPassword());
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        self::assertTrue($hasher->isPasswordValid($user, UserFactory::PASSWORD));
    }

    public function testSessionCookieIsHttpOnlyAndSameSiteLax(): void
    {
        $this->users->create('lea@servio.test');

        $this->login('lea@servio.test', UserFactory::PASSWORD);

        $cookies = $this->client->getResponse()->headers->getCookies();
        self::assertNotEmpty($cookies);
        $sessionCookie = $cookies[0];
        self::assertTrue($sessionCookie->isHttpOnly());
        self::assertSame('lax', $sessionCookie->getSameSite());
    }

    private function login(string $email, string $password): void
    {
        $this->client->jsonRequest('POST', '/api/login', ['email' => $email, 'password' => $password]);
    }

    /**
     * @return array<string, mixed>
     */
    private function responseData(): array
    {
        $data = json_decode((string) $this->client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($data);

        return $data;
    }
}
