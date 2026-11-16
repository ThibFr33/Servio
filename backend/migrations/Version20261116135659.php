<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261116135659 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the employee table, with an optional link to a user account';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE employee (id BINARY(16) NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, contract_type VARCHAR(20) NOT NULL, weekly_minutes INT NOT NULL, hired_at DATE NOT NULL, is_active TINYINT NOT NULL, created_at DATETIME NOT NULL, position_id BINARY(16) NOT NULL, user_id BINARY(16) DEFAULT NULL, establishment_id BINARY(16) NOT NULL, UNIQUE INDEX UNIQ_5D9F75A1A76ED395 (user_id), INDEX IDX_5D9F75A1DD842E46 (position_id), INDEX IDX_5D9F75A18565851 (establishment_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE employee ADD CONSTRAINT FK_5D9F75A1DD842E46 FOREIGN KEY (position_id) REFERENCES position (id)');
        $this->addSql('ALTER TABLE employee ADD CONSTRAINT FK_5D9F75A1A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE employee ADD CONSTRAINT FK_5D9F75A18565851 FOREIGN KEY (establishment_id) REFERENCES establishment (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE employee DROP FOREIGN KEY FK_5D9F75A1DD842E46');
        $this->addSql('ALTER TABLE employee DROP FOREIGN KEY FK_5D9F75A1A76ED395');
        $this->addSql('ALTER TABLE employee DROP FOREIGN KEY FK_5D9F75A18565851');
        $this->addSql('DROP TABLE employee');
    }
}
