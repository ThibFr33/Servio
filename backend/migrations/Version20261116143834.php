<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261116143834 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the link between managers and the positions they manage';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE user_managed_position (user_id BINARY(16) NOT NULL, position_id BINARY(16) NOT NULL, INDEX IDX_E5E32FE3A76ED395 (user_id), INDEX IDX_E5E32FE3DD842E46 (position_id), PRIMARY KEY (user_id, position_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE user_managed_position ADD CONSTRAINT FK_E5E32FE3A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user_managed_position ADD CONSTRAINT FK_E5E32FE3DD842E46 FOREIGN KEY (position_id) REFERENCES position (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user_managed_position DROP FOREIGN KEY FK_E5E32FE3A76ED395');
        $this->addSql('ALTER TABLE user_managed_position DROP FOREIGN KEY FK_E5E32FE3DD842E46');
        $this->addSql('DROP TABLE user_managed_position');
    }
}
