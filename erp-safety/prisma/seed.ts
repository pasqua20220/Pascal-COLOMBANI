import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg(
  'postgres://postgres:postgres@localhost:51214/template1?sslmode=disable'
)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ─── Inspection Themes ─────────────────────────────────────────────────────
  const themes = [
    {
      code: 'EL',
      libelle: 'Installations électriques',
      description: 'Vérification des installations électriques (tableau général, circuits, prises, éclairage de sécurité)',
      periodicity: 'ANNUAL' as const,
      applicableTypes: JSON.stringify(['J','L','M','N','O','P','R','S','T','U','V','W','X','Y']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4']),
      references: [
        { code: 'EL 7 §3', article: 'EL 7 §3', titre: 'Vérification des installations électriques', description: 'Les installations électriques doivent être vérifiées annuellement par un technicien compétent ou un organisme agréé.' },
        { code: 'EL 18', article: 'EL 18', titre: 'Tableaux électriques', description: 'Vérification des tableaux de distribution électrique.' },
      ]
    },
    {
      code: 'ECS',
      libelle: 'Éclairage de sécurité',
      description: 'Vérification des blocs autonomes d\'éclairage de sécurité (BAES) et des systèmes centralisés (BACS)',
      periodicity: 'ANNUAL' as const,
      applicableTypes: JSON.stringify(['J','L','M','N','O','P','R','S','T','U','V','W','X','Y']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4']),
      references: [
        { code: 'EC 7', article: 'EC 7', titre: 'Vérification de l\'éclairage de sécurité', description: 'Vérification annuelle du bon fonctionnement des BAES et BACS.' },
        { code: 'EC 8', article: 'EC 8', titre: 'Autonomie des blocs', description: 'Test d\'autonomie d\'une heure des blocs d\'éclairage de sécurité.' },
      ]
    },
    {
      code: 'AS',
      libelle: 'Système de Sécurité Incendie (SSI) / Alarme',
      description: 'Vérification du Système de Sécurité Incendie, détecteurs automatiques, déclencheurs manuels, désenfumage automatique',
      periodicity: 'ANNUAL' as const,
      applicableTypes: JSON.stringify(['J','L','M','N','O','P','R','S','T','U','V','W','X','Y']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4']),
      references: [
        { code: 'MS 68', article: 'MS 68', titre: 'Vérification du SSI', description: 'Le SSI doit être vérifié annuellement par un organisme accrédité.' },
        { code: 'MS 73', article: 'MS 73', titre: 'Système d\'alarme', description: 'Vérification du système d\'alarme incendie selon la catégorie.' },
        { code: 'AS 9', article: 'AS 9', titre: 'Détecteurs automatiques', description: 'Vérification du fonctionnement des détecteurs automatiques d\'incendie.' },
      ]
    },
    {
      code: 'MS',
      libelle: 'Moyens de secours & extincteurs',
      description: 'Vérification des extincteurs, RIA (Robinets d\'Incendie Armés), colonnes sèches et humides',
      periodicity: 'ANNUAL' as const,
      applicableTypes: JSON.stringify(['J','L','M','N','O','P','R','S','T','U','V','W','X','Y']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4']),
      references: [
        { code: 'MS 39', article: 'MS 39', titre: 'Extincteurs', description: 'Les extincteurs doivent être vérifiés annuellement et rechargés tous les 5 ans ou après utilisation.' },
        { code: 'MS 52', article: 'MS 52', titre: 'Robinets d\'Incendie Armés', description: 'Les RIA doivent être vérifiés annuellement : dévidoir, lance, vanne.' },
        { code: 'MS 55', article: 'MS 55', titre: 'Colonnes sèches', description: 'Vérification annuelle des colonnes sèches et humides.' },
      ]
    },
    {
      code: 'GC',
      libelle: 'Installations au gaz',
      description: 'Vérification des installations de gaz combustible (tuyauteries, appareils, ventilations)',
      periodicity: 'ANNUAL' as const,
      applicableTypes: JSON.stringify(['N','O','R','U']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4']),
      references: [
        { code: 'GC 20', article: 'GC 20', titre: 'Installations gaz', description: 'Vérification annuelle des installations de gaz par un technicien agréé.' },
        { code: 'GC 25', article: 'GC 25', titre: 'Ventilation locaux gaz', description: 'Vérification de la ventilation haute et basse des locaux équipés d\'appareils à gaz.' },
      ]
    },
    {
      code: 'CH',
      libelle: 'Chauffage & appareils de cuisson',
      description: 'Vérification des installations de chauffage, climatisation, conduits de fumée',
      periodicity: 'ANNUAL' as const,
      applicableTypes: JSON.stringify(['J','L','M','N','O','P','R','S','T','U','V','W','X','Y']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4']),
      references: [
        { code: 'CH 58', article: 'CH 58', titre: 'Chaufferies', description: 'Vérification annuelle des chaufferies et appareils de production de chaleur.' },
        { code: 'CH 43', article: 'CH 43', titre: 'Conduits de fumée', description: 'Ramonage et vérification des conduits de fumée, tubage.' },
      ]
    },
    {
      code: 'DS',
      libelle: 'Désenfumage',
      description: 'Vérification des systèmes de désenfumage naturel et mécanique (volets, extracteurs, ouvrants)',
      periodicity: 'ANNUAL' as const,
      applicableTypes: JSON.stringify(['J','L','M','N','O','P','R','S','T','U','V','W','X','Y']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4']),
      references: [
        { code: 'DF 1', article: 'DF 1', titre: 'Système de désenfumage', description: 'Vérification annuelle du système de désenfumage et de son automatisme.' },
        { code: 'MS 63', article: 'MS 63', titre: 'Volets de désenfumage', description: 'Test de fermeture/ouverture des volets coupe-feu et désenfumage.' },
      ]
    },
    {
      code: 'PO',
      libelle: 'Portes coupe-feu & issues de secours',
      description: 'Vérification des portes coupe-feu, portes résistantes au feu, dégagements et issues de secours',
      periodicity: 'ANNUAL' as const,
      applicableTypes: JSON.stringify(['J','L','M','N','O','P','R','S','T','U','V','W','X','Y']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4']),
      references: [
        { code: 'CO 47', article: 'CO 47', titre: 'Portes coupe-feu', description: 'Vérification du bon fonctionnement, de la fermeture automatique et du déverrouillage des portes CF.' },
        { code: 'CO 50', article: 'CO 50', titre: 'Dégagements - Issues de secours', description: 'Vérification de la libre circulation dans les dégagements et de l\'accessibilité des issues de secours.' },
      ]
    },
    {
      code: 'AV',
      libelle: 'Ascenseurs & appareils de levage',
      description: 'Vérification périodique des ascenseurs, monte-charges, escaliers mécaniques',
      periodicity: 'BIANNUAL' as const,
      applicableTypes: JSON.stringify(['J','L','M','N','O','P','R','S','T','U','V','W','X','Y']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4']),
      references: [
        { code: 'AS 1', article: 'AS 1', titre: 'Ascenseurs', description: 'Contrôle technique des ascenseurs tous les 5 ans par un organisme accrédité (Code du travail).' },
      ]
    },
    {
      code: 'SP',
      libelle: 'Sprinkler / extinction automatique',
      description: 'Vérification du système d\'extinction automatique à eau (sprinklers), réseau, têtes, alarmes',
      periodicity: 'ANNUAL' as const,
      applicableTypes: JSON.stringify(['M','N','O','R','U']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3']),
      references: [
        { code: 'EX 11', article: 'EX 11', titre: 'Sprinklers', description: 'Vérification semestrielle et annuelle du réseau sprinkler selon les règles APSAD R1.' },
      ]
    },
    {
      code: 'ACC',
      libelle: 'Accessibilité PMR',
      description: 'Vérification de la conformité d\'accessibilité pour les personnes à mobilité réduite',
      periodicity: 'THREE_YEARS' as const,
      applicableTypes: JSON.stringify(['J','L','M','N','O','P','R','S','T','U','V','W','X','Y']),
      applicableCats: JSON.stringify(['CAT1','CAT2','CAT3','CAT4','CAT5']),
      references: [
        { code: 'Loi 2005-102', article: 'Loi 2005-102', titre: 'Accessibilité des ERP', description: 'Obligation d\'accessibilité des ERP aux personnes handicapées (Code de la construction et de l\'habitation).' },
      ]
    },
  ]

  for (const themeData of themes) {
    const { references, ...themeFields } = themeData
    const theme = await prisma.inspectionTheme.upsert({
      where: { code: themeFields.code },
      update: {},
      create: themeFields,
    })
    for (const ref of references) {
      await prisma.regulatoryReference.upsert({
        where: { id: `${theme.id}-${ref.code}` },
        update: {},
        create: { ...ref, themeId: theme.id },
      }).catch(async () => {
        // If unique constraint fails, just create (no unique on code+themeId, use findFirst)
        const existing = await prisma.regulatoryReference.findFirst({
          where: { themeId: theme.id, code: ref.code }
        })
        if (!existing) {
          await prisma.regulatoryReference.create({
            data: { ...ref, themeId: theme.id }
          })
        }
      })
    }
  }

  // ─── Demo Users ────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('Demo1234!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp-safety.fr' },
    update: {},
    create: {
      email: 'admin@erp-safety.fr',
      passwordHash: password,
      name: 'Administrateur Système',
      role: 'ADMIN',
    },
  })

  const exploitant = await prisma.user.upsert({
    where: { email: 'exploitant@demo.fr' },
    update: {},
    create: {
      email: 'exploitant@demo.fr',
      passwordHash: password,
      name: 'Jean DUPONT',
      role: 'EXPLOITANT',
      phone: '06 12 34 56 78',
      exploitantProfile: {
        create: {
          siret: '12345678901234',
          company: 'SARL Hôtel du Centre',
          address: '10 rue de la Paix',
        }
      }
    },
    include: { exploitantProfile: true }
  })

  const technicien = await prisma.user.upsert({
    where: { email: 'technicien@bureau-veritas.fr' },
    update: {},
    create: {
      email: 'technicien@bureau-veritas.fr',
      passwordHash: password,
      name: 'Marc LEROY',
      role: 'TECHNICIEN',
      phone: '06 98 76 54 32',
      technicienProfile: {
        create: {
          agrement: 'TC-2024-0123',
          organisme: 'Bureau Veritas',
          specialites: JSON.stringify(['EL','ECS','AS','MS','DS','PO']),
        }
      }
    },
  })

  const assureur = await prisma.user.upsert({
    where: { email: 'assureur@axa.fr' },
    update: {},
    create: {
      email: 'assureur@axa.fr',
      passwordHash: password,
      name: 'Sophie MARTIN',
      role: 'ASSUREUR',
      assureurProfile: {
        create: {
          compagnie: 'AXA France',
        }
      }
    },
    include: { assureurProfile: true }
  })

  const institution = await prisma.user.upsert({
    where: { email: 'sdis@sdis75.fr' },
    update: {},
    create: {
      email: 'sdis@sdis75.fr',
      passwordHash: password,
      name: 'Capitaine BERNARD',
      role: 'INSTITUTION',
      institutionProfile: {
        create: {
          institutionType: 'SDIS',
          departement: '75',
          commune: 'Paris',
        }
      }
    },
    include: { institutionProfile: true }
  })

  // ─── Demo ERP ──────────────────────────────────────────────────────────────
  const exploitantProfile = await prisma.exploitantProfile.findUnique({
    where: { userId: exploitant.id }
  })
  if (!exploitantProfile) throw new Error('No exploitant profile')

  const erp = await prisma.eRP.upsert({
    where: { id: 'demo-erp-hotel-centre' },
    update: {},
    create: {
      id: 'demo-erp-hotel-centre',
      nom: 'Hôtel du Centre',
      erpType: 'O',
      category: 'CAT3',
      adresse: '10 rue de la Paix',
      codePostal: '75001',
      ville: 'Paris',
      departement: '75',
      effectifMax: 450,
      activite: 'Hôtellerie - Hébergement',
      numeroERP: 'ERP-75-2024-0042',
      exploitantId: exploitantProfile.id,
    }
  })

  // ─── Insurance contract ────────────────────────────────────────────────────
  const assureurProfile = await prisma.assureurProfile.findUnique({
    where: { userId: assureur.id }
  })
  if (assureurProfile) {
    await prisma.insuranceContract.upsert({
      where: { erpId_assureurId: { erpId: erp.id, assureurId: assureurProfile.id } },
      update: {},
      create: {
        erpId: erp.id,
        assureurId: assureurProfile.id,
        numeroContrat: 'AXA-2024-ERP-0042',
        dateDebut: new Date('2024-01-01'),
        dateFin: new Date('2025-12-31'),
      }
    })
  }

  // ─── Institution access ────────────────────────────────────────────────────
  const institutionProfile = await prisma.institutionProfile.findUnique({
    where: { userId: institution.id }
  })
  if (institutionProfile) {
    await prisma.eRPInstitutionAccess.upsert({
      where: { erpId_institutionId: { erpId: erp.id, institutionId: institutionProfile.id } },
      update: {},
      create: {
        erpId: erp.id,
        institutionId: institutionProfile.id,
      }
    })
  }

  // ─── Demo Inspections ──────────────────────────────────────────────────────
  const elTheme = await prisma.inspectionTheme.findUnique({ where: { code: 'EL' } })
  const asTheme = await prisma.inspectionTheme.findUnique({ where: { code: 'AS' } })
  const msTheme = await prisma.inspectionTheme.findUnique({ where: { code: 'MS' } })
  const dsTheme = await prisma.inspectionTheme.findUnique({ where: { code: 'DS' } })

  if (elTheme) {
    await prisma.inspection.upsert({
      where: { id: 'demo-insp-el-2024' },
      update: {},
      create: {
        id: 'demo-insp-el-2024',
        erpId: erp.id,
        themeId: elTheme.id,
        technicienId: technicien.id,
        dateVisite: new Date('2024-03-15'),
        dateProchaine: new Date('2025-03-15'),
        dateLimite: new Date('2025-03-15'),
        status: 'CONFORME',
        missionObjet: 'Vérification périodique annuelle des installations électriques',
        observations: 'Tableau général BT conforme. Circuits de distribution en bon état. Prise de terre vérifiée.',
        conclusion: 'Installations conformes aux prescriptions réglementaires.',
        signedBy: 'Marc LEROY - Bureau Veritas',
        signedAt: new Date('2024-03-15T14:30:00'),
      }
    })
  }

  if (asTheme) {
    await prisma.inspection.upsert({
      where: { id: 'demo-insp-as-2024' },
      update: {},
      create: {
        id: 'demo-insp-as-2024',
        erpId: erp.id,
        themeId: asTheme.id,
        technicienId: technicien.id,
        dateVisite: new Date('2024-04-10'),
        dateProchaine: new Date('2025-04-10'),
        dateLimite: new Date('2025-04-10'),
        status: 'RESERVE',
        missionObjet: 'Vérification annuelle du Système de Sécurité Incendie',
        observations: '1 détecteur optique défaillant en chambre 214. Centrale SSI catégorie A opérationnelle. Déclencheurs manuels testés OK.',
        conclusion: 'SSI opérationnel avec réserve - remplacement détecteur chambre 214 nécessaire sous 3 mois.',
        reserveItems: JSON.stringify(['Détecteur chambre 214 à remplacer']),
        signedBy: 'Marc LEROY - Bureau Veritas',
        signedAt: new Date('2024-04-10T10:00:00'),
      }
    })
  }

  if (msTheme) {
    await prisma.inspection.upsert({
      where: { id: 'demo-insp-ms-2024' },
      update: {},
      create: {
        id: 'demo-insp-ms-2024',
        erpId: erp.id,
        themeId: msTheme.id,
        technicienId: technicien.id,
        dateVisite: new Date('2024-02-20'),
        dateProchaine: new Date('2025-02-20'),
        dateLimite: new Date('2025-02-20'),
        status: 'CONFORME',
        missionObjet: 'Vérification annuelle des moyens de secours contre l\'incendie',
        observations: '24 extincteurs vérifiés conformes. 4 RIA testés. Pression réseau correcte.',
        conclusion: 'Moyens de secours conformes.',
        signedBy: 'Marc LEROY - Bureau Veritas',
        signedAt: new Date('2024-02-20T09:00:00'),
      }
    })
  }

  if (dsTheme) {
    // One overdue inspection
    await prisma.inspection.upsert({
      where: { id: 'demo-insp-ds-2023' },
      update: {},
      create: {
        id: 'demo-insp-ds-2023',
        erpId: erp.id,
        themeId: dsTheme.id,
        dateVisite: new Date('2023-06-01'),
        dateProchaine: new Date('2024-06-01'),
        dateLimite: new Date('2024-06-01'),
        status: 'EN_RETARD',
        missionObjet: 'Vérification annuelle du système de désenfumage',
        observations: 'Dernière vérification en 2023. Nouvelle vérification à planifier.',
        conclusion: 'En attente de programmation.',
      }
    })
  }

  // ─── Demo Commission Visit & Prescriptions ─────────────────────────────────
  const visit = await prisma.commissionVisit.upsert({
    where: { id: 'demo-visit-2024' },
    update: {},
    create: {
      id: 'demo-visit-2024',
      erpId: erp.id,
      dateVisite: new Date('2024-01-20'),
      typeVisite: 'périodique',
      avis: 'FAVORABLE_AVEC_RESERVES',
      composition: 'Lt Col DURAND (SDIS75), M. PETIT (Mairie Paris 1), Mme RICHARD (DDT75)',
      observations: 'Établissement globalement conforme. Prescriptions émises à lever avant prochaine visite.',
    }
  })

  await prisma.commissionPrescription.upsert({
    where: { id: 'demo-presc-1' },
    update: {},
    create: {
      id: 'demo-presc-1',
      erpId: erp.id,
      visitId: visit.id,
      numero: 'P01',
      description: 'Remplacer la porte coupe-feu CF60 défaillante donnant accès à la chaufferie (ne se ferme plus automatiquement)',
      referenceLegal: 'CO 47 §2 - Portes coupe-feu',
      priorite: 'URGENTE',
      delaiImparti: new Date('2024-06-20'),
      status: 'LEVEE',
    }
  })

  await prisma.commissionPrescription.upsert({
    where: { id: 'demo-presc-2' },
    update: {},
    create: {
      id: 'demo-presc-2',
      erpId: erp.id,
      visitId: visit.id,
      numero: 'P02',
      description: 'Mettre en conformité l\'éclairage de sécurité du couloir niveau -1 (2 blocs autonomes hors service)',
      referenceLegal: 'EC 8 §1 - Eclairage de sécurité',
      priorite: 'NORMALE',
      delaiImparti: new Date('2024-07-20'),
      status: 'OUVERTE',
    }
  })

  await prisma.commissionPrescription.upsert({
    where: { id: 'demo-presc-3' },
    update: {},
    create: {
      id: 'demo-presc-3',
      erpId: erp.id,
      visitId: visit.id,
      numero: 'P03',
      description: 'Procéder à la vérification du désenfumage de la cage d\'escalier principale (volet bloqué en position fermée)',
      referenceLegal: 'DF 1 §3 - Désenfumage escaliers',
      priorite: 'NORMALE',
      delaiImparti: new Date('2024-09-20'),
      status: 'EN_COURS',
    }
  })

  // ─── Demo Special Report ───────────────────────────────────────────────────
  await prisma.specialReport.upsert({
    where: { id: 'demo-special-rvrat' },
    update: {},
    create: {
      id: 'demo-special-rvrat',
      erpId: erp.id,
      reportType: 'RVRAT',
      titre: 'RVRAT - Rapport de Vérification de la Résistance Au Feu - Hôtel du Centre',
      dateRapport: new Date('2022-11-15'),
      organisme: 'CTICM',
      redacteur: 'Ing. THOMAS',
      conclusions: 'Les éléments porteurs de la structure sont conformes aux exigences CF2h. Dalles et planchers CF1h validés.',
    }
  })

  console.log('Seeding complete!')
  console.log('\nDemo accounts (password: Demo1234!):')
  console.log('  admin@erp-safety.fr       - ADMIN')
  console.log('  exploitant@demo.fr        - EXPLOITANT')
  console.log('  technicien@bureau-veritas.fr - TECHNICIEN')
  console.log('  assureur@axa.fr           - ASSUREUR')
  console.log('  sdis@sdis75.fr            - INSTITUTION (SDIS)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
