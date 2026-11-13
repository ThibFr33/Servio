import { Link } from 'react-router'
import { ROUTES } from '../../routes.js'
import { AUTH_STATUS } from '../auth/authContext.js'
import { useAuth } from '../auth/useAuth.js'
import {
  BoxesIcon,
  HeroIllustration,
  InventoryIllustration,
  LabelIcon,
  PaperIcon,
  PlanningIllustration,
  RulesIllustration,
  TeamIllustration,
} from './Illustrations.jsx'
import './Illustrations.css'
import './LandingPage.css'

const GITHUB_URL = 'https://github.com/ThibFr33/Servio'

const PROBLEMS = [
  {
    Icon: PaperIcon,
    title: 'Un planning refait chaque semaine',
    text: 'Sur papier ou sur Excel, recopié, raturé, puis affiché en cuisine. Le moindre changement oblige à tout reprendre.',
  },
  {
    Icon: BoxesIcon,
    title: 'Un inventaire qui prend des heures',
    text: 'Compté à la main, reporté dans un tableau, et des écarts découverts trop tard, quand le produit manque déjà.',
  },
  {
    Icon: LabelIcon,
    title: 'Une traçabilité difficile à tenir',
    text: "Étiquettes, lots et dates limites à conserver pour l'hygiène, dans des classeurs que personne ne retrouve.",
  },
]

const FEATURES = [
  {
    Illustration: PlanningIllustration,
    title: 'Planning',
    text: 'Une vue semaine claire, construite en quelques minutes, à imprimer ou exporter en PDF et Excel.',
  },
  {
    Illustration: RulesIllustration,
    title: 'Règles vérifiées',
    text: 'Repos, amplitude, jours off : Servio vous avertit quand le planning dépasse les règles que vous fixez.',
  },
  {
    Illustration: InventoryIllustration,
    title: 'Inventaire',
    text: 'Des comptages rapides sur mobile, et une alerte dès qu’un produit passe sous son seuil.',
  },
  {
    Illustration: TeamIllustration,
    title: "Toute l'équipe",
    text: 'Chacun consulte le planning depuis son téléphone, chaque responsable gère son équipe.',
  },
]

const STEPS = [
  { title: "Ajoutez l'équipe", text: 'Postes, contrats et responsables.' },
  {
    title: 'Construisez la semaine',
    text: 'Ou dupliquez la précédente.',
  },
  { title: 'Publiez', text: "L'équipe est à jour, sur tous les écrans." },
]

function LandingPage() {
  const { status } = useAuth()
  const isLoggedIn = status === AUTH_STATUS.authenticated
  const mainAction = isLoggedIn
    ? { to: ROUTES.app, label: "Accéder à l'application" }
    : { to: ROUTES.login, label: 'Se connecter' }

  return (
    <div className="landing">
      <header className="landing__header">
        <Link className="landing__brand" to={ROUTES.landing}>
          <span className="landing__logo" aria-hidden="true">
            S
          </span>
          Servio
        </Link>
        <Link className="landing__header-action" to={mainAction.to}>
          {mainAction.label}
        </Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero__text">
            <p className="hero__eyebrow">
              Conçu par un ancien manager de restauration
            </p>
            <h1 className="hero__title">
              Le planning et le stock de votre restaurant, enfin simples.
            </h1>
            <p className="hero__lead">
              Servio rassemble le planning de l’équipe, l’inventaire et la
              traçabilité des produits dans un seul outil, pensé pour le rythme
              d’une cuisine et d’une salle.
            </p>
            <div className="hero__actions">
              <Link className="button button--primary" to={mainAction.to}>
                {mainAction.label}
              </Link>
              <a className="button" href="#fonctionnalites">
                Découvrir les fonctionnalités
              </a>
            </div>
            <p className="hero__note">Projet en cours de développement.</p>
          </div>
          <div className="hero__illustration">
            <HeroIllustration />
          </div>
        </section>

        <section className="section" aria-labelledby="probleme-titre">
          <h2 className="section__title" id="probleme-titre">
            Le service commence bien avant le coup de feu
          </h2>
          <div className="problems">
            {PROBLEMS.map(({ Icon, title, text }) => (
              <article className="problem" key={title}>
                <Icon />
                <h3 className="problem__title">{title}</h3>
                <p className="problem__text">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="section"
          id="fonctionnalites"
          aria-labelledby="fonctionnalites-titre"
        >
          <h2 className="section__title" id="fonctionnalites-titre">
            Tout ce qu’il faut, rien de plus
          </h2>
          <div className="features">
            {FEATURES.map(({ Illustration, title, text }) => (
              <article className="feature" key={title}>
                <div className="feature__illustration">
                  <Illustration />
                </div>
                <h3 className="feature__title">{title}</h3>
                <p className="feature__text">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="etapes-titre">
          <h2 className="section__title" id="etapes-titre">
            Prêt en trois étapes
          </h2>
          <ol className="steps">
            {STEPS.map(({ title, text }) => (
              <li className="step" key={title}>
                <h3 className="step__title">{title}</h3>
                <p className="step__text">{text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="landing__footer">
        <p>
          Servio · Projet réalisé par Thibault Charron ·{' '}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            Code sur GitHub
          </a>
        </p>
        <p className="landing__disclaimer">
          Servio n’est pas un outil RH et ne sert pas de référence en matière de
          droit du travail : les règles de planification sont fixées par
          l’établissement, sous sa responsabilité.
        </p>
      </footer>
    </div>
  )
}

export default LandingPage
