<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261116122355 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the position table, with one name per establishment';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE position (id BINARY(16) NOT NULL, name VARCHAR(50) NOT NULL, color VARCHAR(7) NOT NULL, created_at DATETIME NOT NULL, establishment_id BINARY(16) NOT NULL, UNIQUE INDEX UNIQ_POSITION_ESTABLISHMENT_NAME (establishment_id, name), INDEX IDX_462CE4F58565851 (establishment_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE position ADD CONSTRAINT FK_462CE4F58565851 FOREIGN KEY (establishment_id) REFERENCES establishment (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE position DROP FOREIGN KEY FK_462CE4F58565851');
        $this->addSql('DROP TABLE position');
    }
}
