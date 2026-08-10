import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Building2, BedDouble, Plus, ChevronLeft, CheckCircle2, XCircle, MinusCircle,
  Camera, TrendingUp, AlertTriangle, Download, Loader2, Sparkles, X, ClipboardCheck,
  BellRing, Trash2, ShieldCheck, Shirt, UtensilsCrossed, Wine, PartyPopper, ChefHat,
  Wrench, Briefcase, Wallet, Users, Waves, Megaphone, Leaf,
} from 'lucide-react';
import { storageGet, storageSet } from './lib/storage';

/* ---------------------------------- TOKENS --------------------------------- */

const COLORS = {
  ink: '#0F2438',
  slate: '#33506E',
  slateLight: '#6E88A0',
  ivory: '#FAF7F1',
  paper: '#FFFFFF',
  brass: '#C9AD73',
  brassDark: '#A98A4C',
  brassLight: '#EFE3C8',
  sage: '#4F7A5B',
  sageLight: '#E4EFE6',
  terracotta: '#B85C4A',
  terracottaLight: '#F6E4DF',
  amber: '#C98A2C',
  amberLight: '#F7EAD3',
  border: '#E3DCC9',
};

const F_DISPLAY = "'Fraunces', serif";
const F_BODY = "'Inter', system-ui, sans-serif";
const F_MONO = "'IBM Plex Mono', monospace";

const DEPARTMENTS = [
  { id: 'reception', name: 'Réception', icon: Building2 },
  { id: 'etages', name: 'Étages', icon: BedDouble },
  { id: 'buanderie', name: 'Buanderie', icon: Shirt },
  { id: 'piscine', name: 'Piscine', icon: Waves },
  { id: 'restaurant', name: 'Restaurant', icon: UtensilsCrossed },
  { id: 'cuisine', name: 'Cuisine', icon: ChefHat },
  { id: 'bar', name: 'Bar', icon: Wine },
  { id: 'banquet', name: 'Banquet', icon: PartyPopper },
  { id: 'commercial', name: 'Commercial', icon: Briefcase },
  { id: 'rh', name: 'Ressources Humaines', icon: Users },
  { id: 'gestion', name: 'Gestion & Comptabilité', icon: Wallet },
  { id: 'marketing', name: 'Marketing & Communication', icon: Megaphone },
  { id: 'rse', name: 'RSE', icon: Leaf },
];

const GROUPS = [
  { id: 'hebergement', name: 'Hébergement', deptIds: ['reception', 'etages', 'buanderie', 'piscine'] },
  { id: 'restauration', name: 'Restaurant', deptIds: ['restaurant', 'cuisine', 'bar', 'banquet'] },
  { id: 'commercial_grp', name: 'Commercial', deptIds: ['commercial'] },
  { id: 'rh_grp', name: 'Ressources Humaines', deptIds: ['rh'] },
  { id: 'gestion_grp', name: 'Gestion & Comptabilité', deptIds: ['gestion'] },
  { id: 'marketing_grp', name: 'Marketing & Communication', deptIds: ['marketing'] },
  { id: 'rse_grp', name: 'RSE', deptIds: ['rse'] },
];

const DEPT_COLORS = {
  reception: '#A98A4C', etages: '#4F7A5B', buanderie: '#B85C4A', piscine: '#2C7FA6',
  restaurant: '#C98A2C', cuisine: '#C9515A', bar: '#6B4C9A', banquet: '#1B7A6E',
  commercial: '#33506E', rh: '#9A6B2C', gestion: '#5B6B7A', marketing: '#A64C6B', rse: '#5B8A3A',
};

const CHECKLISTS = {
  reception: [
    { id: 'r1', category: 'Accueil & arrivée', text: "L'accueil client est réalisé dans un délai inférieur à 3 minutes" },
    { id: 'r2', category: 'Accueil & arrivée', text: "Le personnel porte une tenue conforme aux standards de l'établissement" },
    { id: 'r3', category: 'Accueil & arrivée', text: "Le sourire, le contact visuel et le vouvoiement sont respectés" },
    { id: 'r4', category: 'Accueil & arrivée', text: "La procédure de check-in respecte le script standard (pièce d'identité, présentation des services)" },
    { id: 'r5', category: 'Accueil & arrivée', text: "Les informations pratiques (wifi, horaires, accès) sont remises clairement à l'arrivée" },
    { id: 'r6', category: 'Séjour & relation client', text: "Le upselling (surclassement, options) est proposé systématiquement" },
    { id: 'r7', category: 'Séjour & relation client', text: "Les réclamations clients sont enregistrées et font l'objet d'un suivi" },
    { id: 'r8', category: 'Séjour & relation client', text: "Le personnel maîtrise les informations sur les services et horaires de l'établissement" },
    { id: 'r9', category: 'Séjour & relation client', text: "Les demandes de conciergerie (restaurants, transport, activités) sont traitées avec réactivité" },
    { id: 'r10', category: 'Départ & facturation', text: "La facturation est vérifiée avec le client avant remise au check-out" },
    { id: 'r11', category: 'Départ & facturation', text: "La procédure de check-out est rapide et fluide" },
    { id: 'r12', category: 'Départ & facturation', text: "La satisfaction client est recueillie en fin de séjour (enquête, feedback)" },
    { id: 'r13', category: 'Standard & communication', text: "Les appels sont décrochés en moins de 3 sonneries avec la formule d'accueil standard" },
    { id: 'r14', category: 'Standard & communication', text: "Les emails et demandes de réservation sont traités dans un délai de 24 à 48h" },
    { id: 'r15', category: 'Sécurité & conformité', text: "Les procédures de sécurité incendie et d'évacuation sont connues du personnel" },
    { id: 'r16', category: 'Sécurité & conformité', text: "La collecte des données clients respecte le RGPD" },
    { id: 'r17', category: 'Environnement de travail', text: "Le poste de réception est propre, rangé et sans objets personnels visibles" },
  ],
  etages: [
    { id: 'e1', category: 'Nettoyage chambre', text: "La chambre est nettoyée selon le standard (poussière, sols, surfaces)" },
    { id: 'e2', category: 'Nettoyage chambre', text: "La salle de bain est désinfectée, sans traces ni odeurs" },
    { id: 'e3', category: 'Nettoyage chambre', text: "Les surfaces vitrées et miroirs sont impeccables" },
    { id: 'e4', category: 'Linge & confort', text: "Le linge de lit et les serviettes sont changés selon la fréquence définie" },
    { id: 'e5', category: 'Linge & confort', text: "Le lit est refait selon le pliage et la présentation standard" },
    { id: 'e6', category: 'Équipements', text: "Les équipements de la chambre (TV, climatisation, éclairage) sont fonctionnels" },
    { id: 'e7', category: 'Équipements', text: "Le coffre-fort et le minibar sont vérifiés et approvisionnés" },
    { id: 'e8', category: "Produits d'accueil", text: "Les produits d'accueil sont complets, non entamés et conformes au standard" },
    { id: 'e9', category: "Produits d'accueil", text: "La papeterie et les supports d'information en chambre sont à jour" },
    { id: 'e10', category: 'Contrôle qualité & délais', text: "Un contrôle qualité de la chambre est effectué avant remise en vente" },
    { id: 'e11', category: 'Contrôle qualité & délais', text: "Le délai de recouche respecte le standard (inférieur à 30 minutes)" },
    { id: 'e12', category: 'Contrôle qualité & délais', text: "Le délai de chambre à blanc (départ) respecte le standard (inférieur à 45 minutes)" },
    { id: 'e13', category: 'Zones communes', text: "Les couloirs et zones communes de l'étage sont propres et dégagés" },
    { id: 'e14', category: 'Procédures', text: "Le chariot de la gouvernante est correctement approvisionné et rangé" },
    { id: 'e15', category: 'Procédures', text: "Les objets trouvés sont déclarés selon la procédure en vigueur" },
  ],
  buanderie: [
    { id: 'l1', category: 'Traitement du linge', text: "Le tri du linge (sale/propre) est effectué selon la procédure" },
    { id: 'l2', category: 'Traitement du linge', text: "Les délais de traitement du linge respectent le standard" },
    { id: 'l3', category: 'Traitement du linge', text: "Le contrôle qualité du linge (taches, déchirures) est réalisé avant remise en circulation" },
    { id: 'l4', category: 'Stocks & équipements', text: "Les stocks de linge sont suffisants pour couvrir l'activité" },
    { id: 'l5', category: 'Stocks & équipements', text: "Les équipements (machines, fers, presses) sont entretenus et fonctionnels" },
    { id: 'l6', category: 'Stocks & équipements', text: "La consommation d'eau et d'énergie des machines est suivie" },
    { id: 'l7', category: 'Hygiène & sécurité', text: "Les règles d'hygiène et de sécurité (produits chimiques, ventilation) sont respectées" },
    { id: 'l8', category: 'Hygiène & sécurité', text: "Les fiches de sécurité (FDS) des produits utilisés sont disponibles" },
    { id: 'l9', category: 'Service client', text: "Le linge des clients (pressing) est traité et restitué dans les délais annoncés" },
    { id: 'l10', category: 'Service client', text: "Les réclamations liées au linge sont enregistrées et suivies" },
    { id: 'l11', category: 'Organisation', text: "La zone de stockage est propre, rangée et organisée" },
    { id: 'l12', category: 'Organisation', text: "La traçabilité des cycles de lavage (température, durée) est assurée" },
    { id: 'l13', category: 'Organisation', text: "Un contrôle qualité en fin de production est réalisé" },
  ],
  piscine: [
    { id: 'p1', category: "Qualité de l'eau", text: "La qualité de l'eau (pH, chlore/désinfectant) est contrôlée et enregistrée quotidiennement" },
    { id: 'p2', category: "Qualité de l'eau", text: "Le renouvellement d'eau est conforme à la réglementation en vigueur" },
    { id: 'p3', category: 'Sécurité', text: "Le matériel de sécurité (bouée, perche, trousse de secours) est présent et accessible" },
    { id: 'p4', category: 'Sécurité', text: "Les horaires de surveillance et les règles d'utilisation sont affichés de façon visible" },
    { id: 'p5', category: 'Sécurité', text: "La profondeur du bassin et les consignes de sécurité sont signalées conformément à la réglementation" },
    { id: 'p6', category: 'Sécurité', text: "Les règles d'accès (mineurs non accompagnés, tenue) sont respectées et affichées" },
    { id: 'p7', category: 'Hygiène & entretien', text: "Les abords de la piscine sont propres, non glissants et bien entretenus" },
    { id: 'p8', category: 'Hygiène & entretien', text: "Les équipements de filtration et de traitement de l'eau sont fonctionnels" },
    { id: 'p9', category: 'Hygiène & entretien', text: "Les vestiaires et douches attenants sont propres" },
    { id: 'p10', category: 'Conformité & traçabilité', text: "Un registre de sécurité et d'entretien est tenu à jour" },
    { id: 'p11', category: 'Conformité & traçabilité', text: "L'établissement est conforme aux normes de sécurité applicables aux ERP" },
    { id: 'p12', category: 'Expérience client', text: "Les transats et équipements de confort sont en bon état et en nombre suffisant" },
    { id: 'p13', category: 'Expérience client', text: "L'ambiance sonore autour du bassin est conforme aux consignes de l'établissement" },
  ],
  restaurant: [
    { id: 'rs1', category: 'Accueil & service', text: "L'accueil client est réalisé avec courtoisie dans un délai inférieur à 2 minutes" },
    { id: 'rs2', category: 'Accueil & service', text: "Les délais de service (entrée / plat / dessert) respectent les standards" },
    { id: 'rs3', category: 'Accueil & service', text: "La tenue et la présentation du personnel de salle sont conformes" },
    { id: 'rs4', category: 'Mise en place & qualité', text: "La mise en place (nappage, couverts, verres) est conforme au standard" },
    { id: 'rs5', category: 'Mise en place & qualité', text: "La présentation des plats est conforme aux fiches techniques" },
    { id: 'rs6', category: 'Mise en place & qualité', text: "La propreté de la salle est maintenue tout au long du service" },
    { id: 'rs7', category: 'Connaissance produit', text: "Le personnel maîtrise la carte et les suggestions du jour" },
    { id: 'rs8', category: 'Connaissance produit', text: "Les accords mets-vins sont maîtrisés par le personnel" },
    { id: 'rs9', category: 'Hygiène & réglementation', text: "Les normes d'hygiène (HACCP) sont respectées en salle" },
    { id: 'rs10', category: 'Hygiène & réglementation', text: "L'affichage des allergènes est visible et à jour" },
    { id: 'rs11', category: 'Hygiène & réglementation', text: "L'affichage des prix est conforme à la réglementation" },
    { id: 'rs12', category: 'Facturation & satisfaction', text: "L'addition est présentée et vérifiée avec le client" },
    { id: 'rs13', category: 'Facturation & satisfaction', text: "Les avis clients et réclamations sont enregistrés et suivis" },
    { id: 'rs14', category: 'Accessibilité', text: "L'accès pour les personnes à mobilité réduite est fonctionnel" },
  ],
  cuisine: [
    { id: 'c1', category: 'Hygiène & sécurité alimentaire', text: "Les normes HACCP et la chaîne du froid sont respectées" },
    { id: 'c2', category: 'Hygiène & sécurité alimentaire', text: "La propreté des postes de travail et équipements est conforme" },
    { id: 'c3', category: 'Hygiène & sécurité alimentaire', text: "Les tenues et règles d'hygiène du personnel sont respectées" },
    { id: 'c4', category: 'Hygiène & sécurité alimentaire', text: "Le plan de nettoyage et de désinfection (PND) est suivi" },
    { id: 'c5', category: 'Traçabilité', text: "Les DLC / DLUO des produits sont vérifiées et respectées" },
    { id: 'c6', category: 'Traçabilité', text: "Le plan de maîtrise sanitaire (PMS) est correctement appliqué" },
    { id: 'c7', category: 'Traçabilité', text: "L'étiquetage et la traçabilité des matières premières sont assurés" },
    { id: 'c8', category: 'Production', text: "Les fiches techniques et grammages sont respectés" },
    { id: 'c9', category: 'Production', text: "Les temps de préparation et d'envoi respectent les standards" },
    { id: 'c10', category: 'Production', text: "La gestion des pertes et du gaspillage alimentaire est suivie" },
    { id: 'c11', category: 'Approvisionnement', text: "Les stocks et approvisionnements sont gérés sans rupture ni surstock" },
    { id: 'c12', category: 'Approvisionnement', text: "La sélection des fournisseurs est conforme à la politique qualité de l'établissement" },
    { id: 'c13', category: 'Réglementation & sécurité travail', text: "L'affichage des allergènes est présent et à jour" },
    { id: 'c14', category: 'Réglementation & sécurité travail', text: "Les équipements de protection individuelle sont utilisés" },
  ],
  bar: [
    { id: 'b1', category: 'Carte & recettes', text: "La carte des boissons est à jour et connue du personnel" },
    { id: 'b2', category: 'Carte & recettes', text: "Les dosages standards sont respectés dans la préparation des cocktails" },
    { id: 'b3', category: 'Carte & recettes', text: "La fraîcheur et la qualité des ingrédients (fruits, garnitures) sont contrôlées" },
    { id: 'b4', category: 'Environnement', text: "Le bar est propre, rangé et les verres sont impeccables" },
    { id: 'b5', category: 'Environnement', text: "Le matériel (shakers, verrerie) est en bon état et en quantité suffisante" },
    { id: 'b6', category: 'Réglementation', text: "Les règles de responsabilité (alcool, mineurs, licence) sont respectées" },
    { id: 'b7', category: 'Réglementation', text: "L'affichage des prix et de la carte est conforme à la réglementation" },
    { id: 'b8', category: 'Service', text: "Le service est réalisé dans un délai conforme au standard" },
    { id: 'b9', category: 'Service', text: "Le personnel est formé aux techniques de service et de vente additionnelle" },
    { id: 'b10', category: 'Stocks & caisse', text: "Les stocks sont correctement gérés (rotation, dates de péremption)" },
    { id: 'b11', category: 'Stocks & caisse', text: "La caisse est correctement tenue et contrôlée en fin de service" },
    { id: 'b12', category: 'Ambiance', text: "L'ambiance (musique, éclairage) est conforme aux consignes" },
  ],
  banquet: [
    { id: 'ba1', category: 'Préparation', text: "Le plan de salle est conforme au cahier des charges de l'événement" },
    { id: 'ba2', category: 'Préparation', text: "La mise en place (tables, décoration, signalétique) est terminée avant l'heure prévue" },
    { id: 'ba3', category: 'Préparation', text: "Le matériel technique (son, vidéo, éclairage) est testé avant l'événement" },
    { id: 'ba4', category: 'Organisation', text: "Le brief du personnel a été réalisé avant l'événement" },
    { id: 'ba5', category: 'Organisation', text: "La coordination avec les autres services (cuisine, technique) est assurée" },
    { id: 'ba6', category: 'Déroulement', text: "Le timing du service (cocktail, repas, animations) est respecté" },
    { id: 'ba7', category: 'Déroulement', text: "La qualité de présentation des buffets et plats est conforme" },
    { id: 'ba8', category: 'Déroulement', text: "Les imprévus sont gérés sans impact visible pour les convives" },
    { id: 'ba9', category: 'Satisfaction client', text: "Les besoins spécifiques du client (allergies, VIP) sont pris en compte" },
    { id: 'ba10', category: 'Satisfaction client', text: "Un interlocuteur dédié est disponible pendant l'événement" },
    { id: 'ba11', category: 'Clôture', text: "Le débarrassage et la remise en état de la salle sont réalisés dans les délais" },
    { id: 'ba12', category: 'Clôture', text: "Un bilan post-événement est réalisé avec le client" },
    { id: 'ba13', category: 'Sécurité', text: "La capacité maximale de la salle est respectée" },
    { id: 'ba14', category: 'Sécurité', text: "Les issues de secours sont dégagées et accessibles" },
  ],
  commercial: [
    { id: 'co1', category: 'Performance', text: "Les objectifs commerciaux (taux d'occupation, RevPAR) sont suivis et atteints" },
    { id: 'co2', category: 'Performance', text: "Le pricing est ajusté dynamiquement selon la demande" },
    { id: 'co3', category: 'Performance', text: "La part de marché est suivie par rapport à la concurrence" },
    { id: 'co4', category: 'Réactivité', text: "Les devis et propositions sont envoyés dans les délais annoncés" },
    { id: 'co5', category: 'Réactivité', text: "Le suivi des prospects et les relances commerciales sont effectués régulièrement" },
    { id: 'co6', category: 'Réactivité', text: "Le délai de réponse aux demandes groupes et événementiel est respecté" },
    { id: 'co7', category: 'CRM & fidélisation', text: "La base de données clients est correctement renseignée et mise à jour" },
    { id: 'co8', category: 'CRM & fidélisation', text: "Les partenariats et actions de fidélisation sont actifs" },
    { id: 'co9', category: 'CRM & fidélisation', text: "Le programme de fidélité est suivi et exploité" },
    { id: 'co10', category: 'Distribution & tarification', text: "La présence sur les canaux de distribution (OTA, GDS, site web) est optimisée" },
    { id: 'co11', category: 'Distribution & tarification', text: "La parité tarifaire est respectée entre les différents canaux" },
    { id: 'co12', category: 'Distribution & tarification', text: "Les conditions d'annulation et de paiement sont clairement communiquées" },
    { id: 'co13', category: 'Amélioration continue', text: "Les retours clients sont exploités pour améliorer l'offre commerciale" },
    { id: 'co14', category: 'Amélioration continue', text: "Une veille concurrentielle est réalisée régulièrement" },
  ],
  rh: [
    { id: 'h1', category: 'Organisation', text: "Les plannings du personnel sont établis et communiqués à l'avance" },
    { id: 'h2', category: 'Organisation', text: "L'adéquation entre les effectifs et l'activité prévisionnelle est assurée" },
    { id: 'h3', category: 'Organisation', text: "La polyvalence du personnel est organisée pour couvrir les absences" },
    { id: 'h4', category: 'Administratif', text: "Les contrats et documents administratifs du personnel sont à jour" },
    { id: 'h5', category: 'Administratif', text: "Le registre unique du personnel est tenu conforme" },
    { id: 'h6', category: 'Intégration & formation', text: "Le processus d'intégration des nouveaux collaborateurs est appliqué" },
    { id: 'h7', category: 'Intégration & formation', text: "Les formations obligatoires (hygiène, sécurité, incendie) sont réalisées et à jour" },
    { id: 'h8', category: 'Intégration & formation', text: "Un plan de formation continue est suivi" },
    { id: 'h9', category: 'Suivi RH', text: "Le suivi des entretiens annuels est effectué" },
    { id: 'h10', category: 'Suivi RH', text: "Le taux d'absentéisme et de turnover est suivi" },
    { id: 'h11', category: 'Suivi RH', text: "Une grille de rémunération et d'évolution de carrière est formalisée" },
    { id: 'h12', category: 'Conformité', text: "Les règles de droit du travail (heures, repos, affichages obligatoires) sont respectées" },
    { id: 'h13', category: 'Conformité', text: "Le document unique d'évaluation des risques (DUERP) est à jour" },
    { id: 'h14', category: 'Climat social', text: "Le climat social est évalué régulièrement (enquêtes, remontées terrain)" },
    { id: 'h15', category: 'Climat social', text: "Des canaux de communication interne (réunions, remontées terrain) sont actifs" },
  ],
  gestion: [
    { id: 'f1', category: 'Trésorerie & caisse', text: "La clôture journalière des caisses est réalisée et contrôlée" },
    { id: 'f2', category: 'Trésorerie & caisse', text: "Les écarts de caisse ou anomalies sont analysés et justifiés" },
    { id: 'f3', category: 'Trésorerie & caisse', text: "Le suivi de trésorerie est réalisé de façon hebdomadaire" },
    { id: 'f4', category: 'Fournisseurs & achats', text: "Les factures fournisseurs sont vérifiées et payées dans les délais" },
    { id: 'f5', category: 'Fournisseurs & achats', text: "Les contrats fournisseurs sont à jour et régulièrement négociés" },
    { id: 'f6', category: 'Fournisseurs & achats', text: "La procédure de validation des achats est respectée" },
    { id: 'f7', category: 'Pilotage', text: "Le suivi budgétaire (réel vs prévisionnel) est réalisé mensuellement" },
    { id: 'f8', category: 'Pilotage', text: "Les indicateurs financiers clés (CA, marge, GOP, trésorerie) sont suivis" },
    { id: 'f9', category: 'Pilotage', text: "Des tableaux de bord sont partagés régulièrement avec la direction" },
    { id: 'f10', category: 'Contrôle interne', text: "Les procédures de contrôle interne sont respectées" },
    { id: 'f11', category: 'Contrôle interne', text: "La séparation des tâches (engagement / paiement) est assurée" },
    { id: 'f12', category: 'Contrôle interne', text: "Les inventaires sont réalisés selon la fréquence définie" },
    { id: 'f13', category: 'Conformité', text: "Les obligations fiscales, sociales et l'affichage des prix sont respectés" },
    { id: 'f14', category: 'Reporting', text: "Les clôtures comptables mensuelles sont réalisées dans les délais" },
  ],
  marketing: [
    { id: 'm1', category: 'Identité de marque', text: "L'identité visuelle (logo, charte graphique) est appliquée de façon cohérente sur tous les supports" },
    { id: 'm2', category: 'Identité de marque', text: "La charte éditoriale (ton, vocabulaire) est respectée sur toutes les communications" },
    { id: 'm3', category: 'Digital', text: "Le site internet est à jour, fonctionnel et optimisé pour mobile" },
    { id: 'm4', category: 'Digital', text: "Le référencement naturel (SEO) est suivi et optimisé" },
    { id: 'm5', category: 'Digital', text: "Le tunnel de réservation en ligne est fluide et sans friction" },
    { id: 'm6', category: 'Réseaux sociaux', text: "Les réseaux sociaux sont animés régulièrement avec un contenu de qualité" },
    { id: 'm7', category: 'Réseaux sociaux', text: "Un calendrier éditorial est planifié à l'avance" },
    { id: 'm8', category: 'E-réputation', text: "Les avis clients sont suivis et traités sur toutes les plateformes" },
    { id: 'm9', category: 'E-réputation', text: "La note moyenne est suivie avec un objectif d'amélioration défini" },
    { id: 'm10', category: 'Contenu', text: "Les photos et visuels utilisés sont récents et représentatifs de l'établissement" },
    { id: 'm11', category: 'Contenu', text: "Du contenu vidéo est utilisé pour valoriser l'expérience client" },
    { id: 'm12', category: 'Campagnes & performance', text: "Les campagnes marketing sont planifiées avec des objectifs et un budget définis" },
    { id: 'm13', category: 'Campagnes & performance', text: "Les retombées des actions marketing (ROI, trafic, conversions) sont mesurées" },
    { id: 'm14', category: 'Conformité', text: "La communication respecte les engagements RGPD sur les données clients" },
  ],
  rse: [
    { id: 'rse1', category: 'Environnement', text: "Un plan de gestion des déchets (tri, recyclage) est mis en place et suivi" },
    { id: 'rse2', category: 'Environnement', text: "Les consommations d'eau et d'énergie sont suivies avec des objectifs de réduction" },
    { id: 'rse3', category: 'Environnement', text: "Les produits d'accueil et d'entretien utilisés sont éco-responsables" },
    { id: 'rse4', category: 'Environnement', text: "Une démarche de réduction du plastique à usage unique est engagée" },
    { id: 'rse5', category: 'Achats responsables', text: "Une politique d'achats responsables (local, circuits courts) est appliquée" },
    { id: 'rse6', category: 'Achats responsables', text: "Des critères RSE sont intégrés dans le choix des fournisseurs" },
    { id: 'rse7', category: 'Labellisation', text: "Une démarche de labellisation environnementale (Green Key, ISO 14001…) est engagée ou obtenue" },
    { id: 'rse8', category: 'Labellisation', text: "Des objectifs RSE sont formalisés dans un plan d'action annuel" },
    { id: 'rse9', category: 'Social', text: "La diversité et l'égalité professionnelle sont favorisées dans les recrutements" },
    { id: 'rse10', category: 'Social', text: "Des actions solidaires ou locales sont menées régulièrement" },
    { id: 'rse11', category: 'Social', text: "L'accessibilité aux personnes en situation de handicap est prise en compte" },
    { id: 'rse12', category: 'Sensibilisation & gouvernance', text: "Les collaborateurs sont sensibilisés aux enjeux RSE de l'établissement" },
    { id: 'rse13', category: 'Sensibilisation & gouvernance', text: "Le reporting RSE est communiqué aux parties prenantes (clients, investisseurs)" },
  ],
};

const PRIORITES = ['Haute', 'Moyenne', 'Basse'];
const PRIORITE_COLOR = { Haute: COLORS.terracotta, Moyenne: COLORS.amber, Basse: COLORS.sage };

/* --------------------------------- HELPERS ---------------------------------- */

function computeScore(responses) {
  const relevant = responses.filter(r => r.status === 'conforme' || r.status === 'non_conforme');
  if (relevant.length === 0) return null;
  const ok = relevant.filter(r => r.status === 'conforme').length;
  return Math.round((ok / relevant.length) * 100);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function generateAIAnalysis(departmentName, pointText, comment) {
  // Calls our own serverless function (/api/analyze) which holds the Anthropic
  // API key server-side. Never call api.anthropic.com directly from the browser
  // in a hosted app — that would expose the key and be blocked by CORS anyway.
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ department: departmentName, pointText, comment }),
  });
  if (!response.ok) throw new Error('AI proxy request failed');
  return response.json();
}

/* ------------------------------- UI PRIMITIVES ------------------------------ */

function ScoreDial({ score, size = 120, label, thickness = 9 }) {
  const r = size / 2 - thickness;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;
  const color = score == null ? COLORS.border : pct >= 85 ? COLORS.sage : pct >= 60 ? COLORS.amber : COLORS.terracotta;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.border} strokeWidth={thickness} />
          {score != null && (
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness}
              strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.7s ease' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold leading-none">
            {score == null ? '—' : Math.round(score)}
          </span>
          <span style={{ fontFamily: F_MONO, color: COLORS.slateLight }} className="text-[9px] tracking-widest mt-1">/100</span>
        </div>
      </div>
      {label && <span style={{ fontFamily: F_BODY, color: COLORS.slate }} className="text-xs mt-2 text-center max-w-[120px]">{label}</span>}
    </div>
  );
}

function StatusButton({ active, color, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all"
      style={{
        fontFamily: F_BODY,
        borderColor: active ? color : COLORS.border,
        backgroundColor: active ? `${color}1A` : COLORS.paper,
        color: active ? color : COLORS.slate,
        fontWeight: active ? 600 : 500,
      }}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function PriorityBadge({ priorite }) {
  const c = PRIORITE_COLOR[priorite] || COLORS.slate;
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ fontFamily: F_BODY, backgroundColor: `${c}1A`, color: c }}
    >
      {priorite || '—'}
    </span>
  );
}

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    hasDrawn.current = true;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasDrawn.current) onChange(canvasRef.current.toDataURL());
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef} width={380} height={140}
        className="border rounded-lg touch-none mx-auto block"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.paper }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <button onClick={clear} className="text-xs mt-2 underline block mx-auto" style={{ fontFamily: F_BODY, color: COLORS.slate }}>
        Effacer la signature
      </button>
    </div>
  );
}

function Header({ onHome }) {
  return (
    <header className="print:hidden sticky top-0 z-20 border-b" style={{ backgroundColor: COLORS.ink, borderColor: COLORS.ink }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <button onClick={onHome} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.brass }}>
            <BellRing size={18} color={COLORS.ink} />
          </div>
          <div className="text-left">
            <div style={{ fontFamily: F_DISPLAY, color: COLORS.ivory }} className="text-lg leading-none font-semibold">EMB Consulting</div>
            <div style={{ fontFamily: F_BODY, color: COLORS.brassLight }} className="text-[11px] tracking-wide">Audit qualité · Hôtels &amp; Restaurants</div>
          </div>
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------ APP ----------------------------------- */

export default function App() {
  const [data, setData] = useState({ establishments: [], audits: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // dashboard | newEst | estDetail | audit | report
  const [selectedEstId, setSelectedEstId] = useState(null);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [auditStep, setAuditStep] = useState('checklist'); // checklist | signature

  useEffect(() => {
    (async () => {
      try {
        const res = await storageGet('audit-app-data');
        if (res && res.value) setData(JSON.parse(res.value));
      } catch (e) { /* first run, no data yet */ }
      setLoading(false);
    })();
  }, []);

  const saveData = useCallback(async (next) => {
    setData(next);
    try { await storageSet('audit-app-data', JSON.stringify(next)); } catch (e) { console.error(e); }
  }, []);

  const establishments = data.establishments;
  const audits = data.audits;
  const selectedEst = establishments.find(e => e.id === selectedEstId) || null;
  const selectedAudit = audits.find(a => a.id === selectedAuditId) || null;

  /* ---- actions ---- */
  const addEstablishment = (est) => {
    const next = { ...data, establishments: [...establishments, { ...est, id: 'est_' + Date.now(), createdAt: new Date().toISOString() }] };
    saveData(next);
    setView('dashboard');
  };

  const startAudit = (establishmentId, department) => {
    setCurrentAudit({
      id: 'audit_' + Date.now(),
      establishmentId,
      department,
      date: new Date().toISOString(),
      auditor: '',
      responses: CHECKLISTS[department].map(p => ({ ...p, status: null, comment: '', photo: null, ai: null, aiLoading: false, priorite: '', responsable: '', delai: '', budget: '', actionStatus: 'ouvert' })),
      signature: null,
    });
    setAuditStep('checklist');
    setView('audit');
  };

  const updateResponse = (pointId, patch) => {
    setCurrentAudit(prev => ({ ...prev, responses: prev.responses.map(r => r.id === pointId ? { ...r, ...patch } : r) }));
  };

  const runAI = async (pointId) => {
    const point = currentAudit.responses.find(r => r.id === pointId);
    const deptName = DEPARTMENTS.find(d => d.id === currentAudit.department).name;
    updateResponse(pointId, { aiLoading: true });
    try {
      const result = await generateAIAnalysis(deptName, point.text, point.comment);
      updateResponse(pointId, {
        aiLoading: false, ai: result,
        priorite: result.priorite || 'Moyenne',
        responsable: result.responsable || '',
        delai: result.delai || '',
        budget: result.budget_estimatif || '',
      });
    } catch (e) {
      updateResponse(pointId, { aiLoading: false, ai: { error: true, preconisation: "Analyse indisponible pour le moment — merci de réessayer." } });
    }
  };

  const finalizeAudit = () => {
    const score = computeScore(currentAudit.responses);
    const finished = { ...currentAudit, score };
    const next = { ...data, audits: [...audits, finished] };
    saveData(next);
    setSelectedAuditId(finished.id);
    setCurrentAudit(null);
    setView('report');
  };

  const toggleActionStatus = (auditId, pointId) => {
    const next = {
      ...data,
      audits: audits.map(a => a.id !== auditId ? a : {
        ...a,
        responses: a.responses.map(r => r.id !== pointId ? r : { ...r, actionStatus: r.actionStatus === 'cloture' ? 'ouvert' : 'cloture' }),
      }),
    };
    saveData(next);
  };

  const deleteEstablishment = (id) => {
    const next = { establishments: establishments.filter(e => e.id !== id), audits: audits.filter(a => a.establishmentId !== id) };
    saveData(next);
    setView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.ivory }}>
        <Loader2 className="animate-spin" color={COLORS.brass} size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.ivory, fontFamily: F_BODY }}>
      <Header onHome={() => setView('dashboard')} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {view === 'dashboard' && (
          <Dashboard
            establishments={establishments} audits={audits}
            onNew={() => setView('newEst')}
            onOpen={(id) => { setSelectedEstId(id); setView('estDetail'); }}
          />
        )}
        {view === 'newEst' && (
          <NewEstablishment onCancel={() => setView('dashboard')} onSave={addEstablishment} />
        )}
        {view === 'estDetail' && selectedEst && (
          <EstablishmentDetail
            establishment={selectedEst} audits={audits.filter(a => a.establishmentId === selectedEst.id)}
            onBack={() => setView('dashboard')}
            onStartAudit={(dept) => startAudit(selectedEst.id, dept)}
            onOpenReport={(id) => { setSelectedAuditId(id); setView('report'); }}
            onDelete={() => deleteEstablishment(selectedEst.id)}
          />
        )}
        {view === 'audit' && currentAudit && (
          <AuditFlow
            audit={currentAudit} step={auditStep} setStep={setAuditStep}
            onUpdate={updateResponse} onRunAI={runAI}
            onSetAuditor={(name) => setCurrentAudit(p => ({ ...p, auditor: name }))}
            onSetSignature={(sig) => setCurrentAudit(p => ({ ...p, signature: sig }))}
            onFinalize={finalizeAudit}
            onBack={() => { setCurrentAudit(null); setView('estDetail'); }}
          />
        )}
        {view === 'report' && selectedAudit && (
          <Report
            audit={selectedAudit}
            establishment={establishments.find(e => e.id === selectedAudit.establishmentId)}
            allEstAudits={audits.filter(a => a.establishmentId === selectedAudit.establishmentId && a.department === selectedAudit.department)}
            onToggleAction={(pointId) => toggleActionStatus(selectedAudit.id, pointId)}
            onBack={() => setView('estDetail')}
          />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------ DASHBOARD ----------------------------------- */

function Dashboard({ establishments, audits, onNew, onOpen }) {
  const avgScore = audits.length ? Math.round(audits.reduce((s, a) => s + (a.score || 0), 0) / audits.length) : null;
  const openActions = audits.reduce((s, a) => s + a.responses.filter(r => r.status === 'non_conforme' && r.actionStatus !== 'cloture').length, 0);
  const closedActions = audits.reduce((s, a) => s + a.responses.filter(r => r.status === 'non_conforme' && r.actionStatus === 'cloture').length, 0);

  const kpis = [
    { label: 'Établissements', value: establishments.length },
    { label: 'Audits réalisés', value: audits.length },
    { label: 'Score moyen', value: avgScore == null ? '—' : `${avgScore}/100` },
    { label: 'Actions ouvertes', value: openActions, sub: `${closedActions} clôturées` },
  ];

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-3xl font-semibold">Tableau de bord</h1>
          <p style={{ color: COLORS.slate }} className="text-sm mt-1">Vue d'ensemble de la qualité sur l'ensemble du parc</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}
        >
          <Plus size={16} /> Nouvel établissement
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {kpis.map((k, i) => (
          <div key={i} className="rounded-xl border p-4" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
            <div style={{ fontFamily: F_MONO, color: COLORS.ink }} className="text-2xl font-medium">{k.value}</div>
            <div style={{ color: COLORS.slate }} className="text-xs mt-1">{k.label}</div>
            {k.sub && <div style={{ color: COLORS.sage }} className="text-[11px] mt-0.5">{k.sub}</div>}
          </div>
        ))}
      </div>

      {establishments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center" style={{ borderColor: COLORS.border }}>
          <ClipboardCheck className="mx-auto mb-3" color={COLORS.brass} size={28} />
          <p style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-lg mb-1">Aucun établissement pour l'instant</p>
          <p style={{ color: COLORS.slate }} className="text-sm mb-4">Créez votre premier établissement pour lancer un audit.</p>
          <button onClick={onNew} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: COLORS.brass, color: COLORS.ink }}>
            Créer un établissement
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {establishments.map(est => {
            const estAudits = audits.filter(a => a.establishmentId === est.id);
            const deptScores = DEPARTMENTS.map(d => {
              const list = estAudits.filter(a => a.department === d.id).sort((a, b) => new Date(b.date) - new Date(a.date));
              return list[0]?.score ?? null;
            }).filter(s => s != null);
            const globalScore = deptScores.length ? Math.round(deptScores.reduce((a, b) => a + b, 0) / deptScores.length) : null;
            return (
              <button key={est.id} onClick={() => onOpen(est.id)} className="text-left rounded-xl border p-5 flex items-center gap-4 hover:shadow-sm transition-shadow" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
                <ScoreDial score={globalScore} size={72} thickness={7} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-lg font-semibold truncate">{est.name}</div>
                  <div style={{ color: COLORS.slate }} className="text-sm">{est.type}{est.ville ? ` · ${est.ville}` : ''}</div>
                  <div style={{ color: COLORS.slateLight }} className="text-xs mt-1">{estAudits.length} audit{estAudits.length > 1 ? 's' : ''} réalisé{estAudits.length > 1 ? 's' : ''}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- NEW ESTABLISHMENT --------------------------------- */

function NewEstablishment({ onCancel, onSave }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Hôtel');
  const [ville, setVille] = useState('');
  const [categorie, setCategorie] = useState('');

  return (
    <div className="max-w-lg">
      <button onClick={onCancel} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> Retour
      </button>
      <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-6">Nouvel établissement</h1>
      <div className="space-y-4 rounded-xl border p-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Nom de l'établissement</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Hôtel Belle Rive" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }}>
              <option>Hôtel</option>
              <option>Restaurant</option>
              <option>Hôtel-Restaurant</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Catégorie</label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }}>
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Ville</label>
          <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Ex : Marrakech" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} />
        </div>
        <button
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), type, ville: ville.trim(), categorie })}
          className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}
        >
          Créer l'établissement
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- ESTABLISHMENT DETAIL -------------------------------- */

function EstablishmentDetail({ establishment, audits, onBack, onStartAudit, onOpenReport, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deptScores = DEPARTMENTS.map(d => {
    const list = audits.filter(a => a.department === d.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    return { dept: d, latest: list[0] || null, history: list };
  });
  const validScores = deptScores.map(d => d.latest?.score).filter(s => s != null);
  const globalScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;

  const chartData = [...audits].sort((a, b) => new Date(a.date) - new Date(b.date)).map(a => ({
    date: fmtDate(a.date),
    [DEPARTMENTS.find(d => d.id === a.department).name]: a.score,
  }));

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> Tableau de bord
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-3xl font-semibold">{establishment.name}</h1>
          <p style={{ color: COLORS.slate }} className="text-sm mt-1">{establishment.type}{establishment.ville ? ` · ${establishment.ville}` : ''}{establishment.categorie ? ` · ${establishment.categorie}★` : ''}</p>
        </div>
        <ScoreDial score={globalScore} label="Score global" size={90} />
      </div>

      {GROUPS.map(group => {
        const groupDepts = deptScores.filter(d => group.deptIds.includes(d.dept.id));
        const groupValid = groupDepts.map(d => d.latest?.score).filter(s => s != null);
        const groupScore = groupValid.length ? Math.round(groupValid.reduce((a, b) => a + b, 0) / groupValid.length) : null;
        return (
          <div key={group.id} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-lg font-semibold">{group.name}</span>
              {groupScore != null && (
                <span style={{ fontFamily: F_MONO, color: COLORS.brassDark, borderColor: COLORS.border }} className="text-xs px-2 py-0.5 rounded-full border">
                  Score pôle : {groupScore}/100
                </span>
              )}
            </div>
            <div className={`grid gap-4 ${groupDepts.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
              {groupDepts.map(({ dept, latest }) => {
                const Icon = dept.icon;
                return (
                  <div key={dept.id} className="rounded-xl border p-5" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={17} color={COLORS.brassDark} className="shrink-0" />
                        <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold text-base truncate">{dept.name}</span>
                      </div>
                      <ScoreDial score={latest?.score ?? null} size={50} thickness={5} />
                    </div>
                    <p style={{ color: COLORS.slateLight }} className="text-xs mb-3">
                      {latest ? `${fmtDate(latest.date)} · ${latest.auditor || 'auditeur non renseigné'}` : "Aucun audit réalisé"}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => onStartAudit(dept.id)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: COLORS.brass, color: COLORS.ink }}>
                        Lancer un audit
                      </button>
                      {latest && (
                        <button onClick={() => onOpenReport(latest.id)} className="px-2.5 py-2 rounded-lg text-xs border" style={{ borderColor: COLORS.border, color: COLORS.slate }}>
                          Rapport
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {chartData.length > 0 && (
        <div className="rounded-xl border p-5 mb-8" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} color={COLORS.brassDark} />
            <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold">Évolution des scores</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.slate }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.slate }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {[...new Set(audits.map(a => a.department))].map(deptId => (
                <Line key={deptId} type="monotone" dataKey={DEPARTMENTS.find(d => d.id === deptId).name} stroke={DEPT_COLORS[deptId]} strokeWidth={2} connectNulls dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border p-5 mb-8" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <span style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold">Historique des audits</span>
        {audits.length === 0 ? (
          <p style={{ color: COLORS.slateLight }} className="text-sm mt-2">Aucun audit pour le moment.</p>
        ) : (
          <div className="mt-3 divide-y" style={{ borderColor: COLORS.border }}>
            {[...audits].sort((a, b) => new Date(b.date) - new Date(a.date)).map(a => (
              <button key={a.id} onClick={() => onOpenReport(a.id)} className="w-full flex items-center justify-between py-3 text-left">
                <div>
                  <div style={{ color: COLORS.ink }} className="text-sm font-medium">{DEPARTMENTS.find(d => d.id === a.department).name} — {fmtDate(a.date)}</div>
                  <div style={{ color: COLORS.slateLight }} className="text-xs">{a.auditor || 'Auditeur non renseigné'}</div>
                </div>
                <PriorityBadge priorite={a.score >= 85 ? 'Basse' : a.score >= 60 ? 'Moyenne' : 'Haute'} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-right">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-xs flex items-center gap-1 ml-auto" style={{ color: COLORS.terracotta }}>
            <Trash2 size={13} /> Supprimer l'établissement
          </button>
        ) : (
          <div className="flex items-center gap-2 justify-end text-xs">
            <span style={{ color: COLORS.slate }}>Confirmer la suppression ?</span>
            <button onClick={onDelete} className="px-2 py-1 rounded font-semibold" style={{ backgroundColor: COLORS.terracotta, color: COLORS.paper }}>Oui, supprimer</button>
            <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded border" style={{ borderColor: COLORS.border }}>Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------ AUDIT FLOW ------------------------------------ */

function AuditFlow({ audit, step, setStep, onUpdate, onRunAI, onSetAuditor, onSetSignature, onFinalize, onBack }) {
  const dept = DEPARTMENTS.find(d => d.id === audit.department);
  const answered = audit.responses.filter(r => r.status).length;
  const total = audit.responses.length;
  const categories = [...new Set(audit.responses.map(r => r.category))];

  if (step === 'signature') {
    return (
      <div className="max-w-lg mx-auto">
        <button onClick={() => setStep('checklist')} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
          <ChevronLeft size={16} /> Revenir à la grille
        </button>
        <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-1">Validation de l'audit</h1>
        <p style={{ color: COLORS.slate }} className="text-sm mb-6">{dept.name} · Score obtenu : <b>{computeScore(audit.responses)}/100</b></p>

        <div className="rounded-xl border p-5 mb-4" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <label className="text-xs font-semibold" style={{ color: COLORS.slate }}>Nom de l'auditeur</label>
          <input value={audit.auditor} onChange={e => onSetAuditor(e.target.value)} placeholder="Prénom et nom" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border }} />
        </div>

        <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <label className="text-xs font-semibold block mb-2" style={{ color: COLORS.slate }}>Signature</label>
          <SignaturePad onChange={onSetSignature} />
        </div>

        <button
          disabled={!audit.auditor.trim() || !audit.signature}
          onClick={onFinalize}
          className="w-full py-3 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}
        >
          Valider et générer le rapport
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4" style={{ color: COLORS.slate }}>
        <ChevronLeft size={16} /> Quitter l'audit
      </button>
      <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold mb-1">Audit — {dept.name}</h1>
      <p style={{ color: COLORS.slate }} className="text-sm mb-6">{answered}/{total} points contrôlés</p>

      {categories.map(cat => (
        <div key={cat} className="mb-6">
          <div style={{ fontFamily: F_MONO, color: COLORS.brassDark }} className="text-xs uppercase tracking-widest mb-2">{cat}</div>
          <div className="space-y-3">
            {audit.responses.filter(r => r.category === cat).map(point => (
              <ChecklistItem key={point.id} point={point} onUpdate={(patch) => onUpdate(point.id, patch)} onRunAI={() => onRunAI(point.id)} />
            ))}
          </div>
        </div>
      ))}

      <div className="fixed bottom-0 left-0 right-0 print:hidden border-t p-4" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.border }}>
            <div className="h-full transition-all" style={{ width: `${(answered / total) * 100}%`, backgroundColor: COLORS.brass }} />
          </div>
          <button
            disabled={answered < total}
            onClick={() => setStep('signature')}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap disabled:opacity-40"
            style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}
          >
            Continuer vers la signature
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ point, onUpdate, onRunAI }) {
  const isNonConforme = point.status === 'non_conforme';
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate({ photo: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: COLORS.paper, borderColor: isNonConforme ? COLORS.terracotta : COLORS.border }}>
      <p style={{ color: COLORS.ink }} className="text-sm font-medium mb-3">{point.text}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <StatusButton active={point.status === 'conforme'} color={COLORS.sage} icon={CheckCircle2} label="Conforme" onClick={() => onUpdate({ status: 'conforme' })} />
        <StatusButton active={point.status === 'non_conforme'} color={COLORS.terracotta} icon={XCircle} label="Non conforme" onClick={() => onUpdate({ status: 'non_conforme' })} />
        <StatusButton active={point.status === 'na'} color={COLORS.slate} icon={MinusCircle} label="Non applicable" onClick={() => onUpdate({ status: 'na' })} />
      </div>

      {point.status && point.status !== 'na' && (
        <div className="space-y-2">
          <textarea
            value={point.comment} onChange={e => onUpdate({ comment: e.target.value })}
            placeholder="Commentaire de l'auditeur (optionnel)"
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none" rows={2}
            style={{ borderColor: COLORS.border }}
          />
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: COLORS.border, color: COLORS.slate }}>
              <Camera size={13} /> {point.photo ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            {point.photo && <img src={point.photo} alt="" className="w-10 h-10 rounded object-cover border" style={{ borderColor: COLORS.border }} />}
          </div>
        </div>
      )}

      {isNonConforme && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
          {!point.ai && !point.aiLoading && (
            <button onClick={onRunAI} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.terracottaLight, color: COLORS.terracotta }}>
              <Sparkles size={13} /> Générer l'analyse IA
            </button>
          )}
          {point.aiLoading && (
            <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.slate }}>
              <Loader2 size={13} className="animate-spin" /> Analyse en cours…
            </div>
          )}
          {point.ai && !point.ai.error && (
            <div className="rounded-lg p-3 text-xs space-y-2" style={{ backgroundColor: COLORS.terracottaLight }}>
              <div><b style={{ color: COLORS.ink }}>Cause probable :</b> <span style={{ color: COLORS.slate }}>{point.ai.cause_probable}</span></div>
              <div>
                <b style={{ color: COLORS.ink }}>Risques :</b>
                <ul className="list-disc ml-4 mt-0.5" style={{ color: COLORS.slate }}>
                  {(point.ai.risques || []).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div><b style={{ color: COLORS.ink }}>Préconisation :</b> <span style={{ color: COLORS.slate }}>{point.ai.preconisation}</span></div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-[10px] font-semibold mb-0.5" style={{ color: COLORS.slate }}>Priorité</label>
                  <select value={point.priorite} onChange={e => onUpdate({ priorite: e.target.value })} className="w-full px-2 py-1 rounded border text-xs" style={{ borderColor: COLORS.border }}>
                    {PRIORITES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold mb-0.5" style={{ color: COLORS.slate }}>Responsable</label>
                  <input value={point.responsable} onChange={e => onUpdate({ responsable: e.target.value })} className="w-full px-2 py-1 rounded border text-xs" style={{ borderColor: COLORS.border }} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold mb-0.5" style={{ color: COLORS.slate }}>Délai</label>
                  <input value={point.delai} onChange={e => onUpdate({ delai: e.target.value })} className="w-full px-2 py-1 rounded border text-xs" style={{ borderColor: COLORS.border }} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold mb-0.5" style={{ color: COLORS.slate }}>Budget estimatif</label>
                  <input value={point.budget} onChange={e => onUpdate({ budget: e.target.value })} className="w-full px-2 py-1 rounded border text-xs" style={{ borderColor: COLORS.border }} />
                </div>
              </div>
            </div>
          )}
          {point.ai?.error && (
            <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.terracotta }}>
              <AlertTriangle size={13} /> {point.ai.preconisation}
              <button onClick={onRunAI} className="underline">Réessayer</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------- REPORT --------------------------------------- */

function Report({ audit, establishment, allEstAudits, onToggleAction, onBack }) {
  const dept = DEPARTMENTS.find(d => d.id === audit.department);
  const conformes = audit.responses.filter(r => r.status === 'conforme');
  const nonConformes = audit.responses.filter(r => r.status === 'non_conforme')
    .sort((a, b) => PRIORITES.indexOf(a.priorite) - PRIORITES.indexOf(b.priorite));

  const prevAudit = [...allEstAudits].filter(a => a.id !== audit.id && new Date(a.date) < new Date(audit.date)).sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const radarData = [...new Set(audit.responses.map(r => r.category))].map(cat => {
    const pts = audit.responses.filter(r => r.category === cat && r.status !== 'na' && r.status);
    const score = pts.length ? Math.round((pts.filter(r => r.status === 'conforme').length / pts.length) * 100) : 0;
    const prevPts = prevAudit ? prevAudit.responses.filter(r => r.category === cat && r.status !== 'na' && r.status) : [];
    const prevScore = prevPts.length ? Math.round((prevPts.filter(r => r.status === 'conforme').length / prevPts.length) * 100) : null;
    return { categorie: cat, Actuel: score, ...(prevScore != null ? { Précédent: prevScore } : {}) };
  });

  const closedCount = nonConformes.filter(r => r.actionStatus === 'cloture').length;

  const resume = `L'audit du département ${dept.name} de ${establishment?.name || "l'établissement"} réalisé le ${fmtDate(audit.date)} par ${audit.auditor} obtient un score de ${audit.score}/100. Sur ${audit.responses.filter(r => r.status !== 'na').length} points contrôlés, ${conformes.length} sont conformes et ${nonConformes.length} nécessitent une action corrective. ${nonConformes.length > 0 ? `Le point le plus prioritaire concerne : « ${nonConformes[0].text} ».` : "Aucune non-conformité majeure n'a été relevée lors de cet audit."}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="print:hidden flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-1 text-sm" style={{ color: COLORS.slate }}>
          <ChevronLeft size={16} /> Retour à l'établissement
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: COLORS.ink, color: COLORS.ivory }}>
          <Download size={15} /> Exporter en PDF
        </button>
      </div>

      <div className="rounded-xl border p-6 mb-6" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div style={{ fontFamily: F_MONO, color: COLORS.brassDark }} className="text-xs uppercase tracking-widest mb-1">Rapport d'audit</div>
            <h1 style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="text-2xl font-semibold">{establishment?.name} — {dept.name}</h1>
            <p style={{ color: COLORS.slate }} className="text-sm mt-1">{fmtDate(audit.date)} · Auditeur : {audit.auditor}</p>
          </div>
          <ScoreDial score={audit.score} size={80} />
        </div>

        <div className="mb-5">
          <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold mb-1.5">Résumé exécutif</div>
          <p style={{ color: COLORS.slate }} className="text-sm leading-relaxed">{resume}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="rounded-lg p-3" style={{ backgroundColor: COLORS.sageLight }}>
            <div style={{ color: COLORS.sage }} className="text-xs font-semibold mb-1.5">FORCES</div>
            <ul className="text-xs space-y-1" style={{ color: COLORS.ink }}>
              {conformes.slice(0, 4).map(c => <li key={c.id}>• {c.text}</li>)}
              {conformes.length === 0 && <li style={{ color: COLORS.slateLight }}>Aucun point conforme relevé</li>}
            </ul>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: COLORS.terracottaLight }}>
            <div style={{ color: COLORS.terracotta }} className="text-xs font-semibold mb-1.5">FAIBLESSES</div>
            <ul className="text-xs space-y-1" style={{ color: COLORS.ink }}>
              {nonConformes.slice(0, 4).map(c => <li key={c.id}>• {c.text}</li>)}
              {nonConformes.length === 0 && <li style={{ color: COLORS.slateLight }}>Aucune non-conformité relevée</li>}
            </ul>
          </div>
        </div>

        {radarData.length > 0 && (
          <div className="mb-2">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={COLORS.border} />
                <PolarAngleAxis dataKey="categorie" tick={{ fontSize: 10, fill: COLORS.slate }} />
                <Radar name="Actuel" dataKey="Actuel" stroke={COLORS.brassDark} fill={COLORS.brass} fillOpacity={0.35} />
                {prevAudit && <Radar name="Précédent" dataKey="Précédent" stroke={COLORS.slate} fill={COLORS.slate} fillOpacity={0.12} />}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {nonConformes.length > 0 && (
        <div className="rounded-xl border p-6 mb-6" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontFamily: F_DISPLAY, color: COLORS.ink }} className="font-semibold">Plan d'actions</div>
            <span style={{ color: COLORS.slateLight }} className="text-xs">{closedCount}/{nonConformes.length} clôturées</span>
          </div>
          <div className="space-y-3">
            {nonConformes.map(nc => (
              <div key={nc.id} className="rounded-lg border p-3" style={{ borderColor: COLORS.border, opacity: nc.actionStatus === 'cloture' ? 0.55 : 1 }}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p style={{ color: COLORS.ink }} className="text-sm font-medium flex-1">{nc.text}</p>
                  <PriorityBadge priorite={nc.priorite} />
                </div>
                {nc.comment && <p style={{ color: COLORS.slateLight }} className="text-xs mb-1.5 italic">« {nc.comment} »</p>}
                {nc.photo && <img src={nc.photo} alt="" className="w-16 h-16 rounded object-cover border mb-1.5" style={{ borderColor: COLORS.border }} />}
                <div className="grid grid-cols-3 gap-2 text-xs mb-2" style={{ color: COLORS.slate }}>
                  <div><b>Responsable :</b> {nc.responsable || '—'}</div>
                  <div><b>Délai :</b> {nc.delai || '—'}</div>
                  <div><b>Budget :</b> {nc.budget || '—'}</div>
                </div>
                <label className="flex items-center gap-2 text-xs print:hidden" style={{ color: COLORS.slate }}>
                  <input type="checkbox" checked={nc.actionStatus === 'cloture'} onChange={() => onToggleAction(nc.id)} />
                  Action traitée
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border p-6 flex items-center justify-between" style={{ backgroundColor: COLORS.paper, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.slate }}>
          <ShieldCheck size={16} color={COLORS.sage} /> Audit signé par {audit.auditor}
        </div>
        {audit.signature && <img src={audit.signature} alt="Signature" className="h-14" />}
      </div>
    </div>
  );
}
