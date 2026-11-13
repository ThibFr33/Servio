<?php

declare(strict_types=1);

namespace App\Tests\Functional\Security;

use App\Security\OriginCheckSubscriber;
use App\Tests\Factory\UserFactory;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * The login request is used as the example of a request that changes state:
 * a successful login (200) proves the request went through the origin check.
 */
final class OriginCheckTest extends WebTestCase
{
    // The test client sends its requests to http://localhost.
    private const APP_ORIGIN = 'http://localhost';

    private KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();

        $container = static::getContainer();
        (new UserFactory(
            $container->get(EntityManagerInterface::class),
            $container->get(UserPasswordHasherInterface::class),
        ))->create('lea@servio.test');
    }

    public function testRequestFromTheAppOriginIsAccepted(): void
    {
        $this->login(['HTTP_ORIGIN' => self::APP_ORIGIN]);

        self::assertResponseIsSuccessful();
    }

    public function testRequestFromAnotherOriginIsRejectedEvenWithValidCredentials(): void
    {
        $this->login(['HTTP_ORIGIN' => 'https://evil.example']);

        $this->assertRejected();
    }

    public function testRequestWithoutOriginNorRefererIsRejected(): void
    {
        $this->login([]);

        $this->assertRejected();
    }

    public function testRequestWithoutOriginButWithASameOriginRefererIsAccepted(): void
    {
        $this->login(['HTTP_REFERER' => self::APP_ORIGIN.'/planning']);

        self::assertResponseIsSuccessful();
    }

    public function testRequestWithAnotherOriginRefererIsRejected(): void
    {
        $this->login(['HTTP_REFERER' => 'https://evil.example/page']);

        $this->assertRejected();
    }

    public function testRequestWithNullOriginIsRejected(): void
    {
        $this->login(['HTTP_ORIGIN' => 'null']);

        $this->assertRejected();
    }

    public function testGetRequestIsNotChecked(): void
    {
        $this->client->request('GET', '/api');

        self::assertResponseIsSuccessful();
    }

    /**
     * @param array<string, string> $headers
     */
    private function login(array $headers): void
    {
        $this->client->jsonRequest(
            'POST',
            '/api/login',
            ['email' => 'lea@servio.test', 'password' => UserFactory::PASSWORD],
            $headers,
        );
    }

    private function assertRejected(): void
    {
        self::assertResponseStatusCodeSame(403);
        $data = json_decode((string) $this->client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($data);
        self::assertSame(OriginCheckSubscriber::REJECTED_MESSAGE, $data['error']);
    }
}
