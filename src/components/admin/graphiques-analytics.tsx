// Fichier: src/components/admin/graphiques-analytics.tsx

'use client'

import React from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer 
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from 'lucide-react'

// Palette de couleurs cohérente avec SereniBook
export const COULEURS_SERENIBOOK = {
  primary: '#8b5cf6',        // Violet principal
  secondary: '#06b6d4',      // Cyan
  success: '#10b981',        // Vert
  warning: '#f59e0b',        // Orange
  danger: '#ef4444',         // Rouge
  info: '#3b82f6',          // Bleu
  muted: '#6b7280'          // Gris
}

export const PALETTE_GRAPHIQUE = [
  COULEURS_SERENIBOOK.primary,
  COULEURS_SERENIBOOK.secondary,
  COULEURS_SERENIBOOK.success,
  COULEURS_SERENIBOOK.warning,
  COULEURS_SERENIBOOK.danger,
  COULEURS_SERENIBOOK.info,
  COULEURS_SERENIBOOK.muted
]

// Types pour les props des composants
interface PropsGraphiqueBase {
  titre: string
  sousTitre?: string
  donnees: any[]
  hauteur?: number
  chargement?: boolean
}

/**
 * Composant de graphique en aires pour l'évolution temporelle
 */
interface PropsGraphiqueAires extends PropsGraphiqueBase {
  cleX: string
  cleY: string
  couleur?: string
  remplissage?: boolean
  formater?: (valeur: any) => string
}

export function GraphiqueAires({
  titre,
  sousTitre,
  donnees,
  hauteur = 300,
  chargement = false,
  cleX,
  cleY,
  couleur = COULEURS_SERENIBOOK.primary,
  remplissage = true,
  formater = (valeur) => valeur?.toString() || '0'
}: PropsGraphiqueAires) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">{titre}</div>
            {sousTitre && <div className="text-sm text-gray-600 mt-1">{sousTitre}</div>}
          </div>
          {donnees.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {donnees.length} points
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chargement ? (
          <div className="flex items-center justify-center" style={{ height: hauteur }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : donnees.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: hauteur }}>
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={hauteur}>
            <AreaChart data={donnees}>
              <defs>
                <linearGradient id={`gradient-${cleY}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={couleur} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={couleur} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey={cleX} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip 
                formatter={(valeur) => [formater(valeur), titre]}
                labelFormatter={(label) => `Période: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey={cleY}
                stroke={couleur}
                strokeWidth={2}
                fill={remplissage ? `url(#gradient-${cleY})` : 'transparent'}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Graphique en barres avec personnalisation avancée
 */
interface PropsGraphiqueBarres extends PropsGraphiqueBase {
  cleX: string
  cleY: string
  couleur?: string
  horizontal?: boolean
  empilee?: boolean
  formater?: (valeur: any) => string
  clesMultiples?: string[]
}

export function GraphiqueBarres({
  titre,
  sousTitre,
  donnees,
  hauteur = 300,
  chargement = false,
  cleX,
  cleY,
  couleur = COULEURS_SERENIBOOK.primary,
  horizontal = false,
  empilee = false,
  formater = (valeur) => valeur?.toString() || '0',
  clesMultiples
}: PropsGraphiqueBarres) {
  const BarChartComponent = BarChart

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">{titre}</div>
            {sousTitre && <div className="text-sm text-gray-600 mt-1">{sousTitre}</div>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chargement ? (
          <div className="flex items-center justify-center" style={{ height: hauteur }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : donnees.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: hauteur }}>
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={hauteur}>
            <BarChartComponent 
              data={donnees}
              layout={horizontal ? 'horizontal' : 'vertical'}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                type={horizontal ? 'number' : 'category'}
                dataKey={horizontal ? undefined : cleX}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis 
                type={horizontal ? 'category' : 'number'}
                dataKey={horizontal ? cleX : undefined}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Tooltip 
                formatter={(valeur, nom) => [formater(valeur), nom]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              {clesMultiples ? (
                <>
                  <Legend />
                  {clesMultiples.map((cle, index) => (
                    <Bar 
                      key={cle}
                      dataKey={cle} 
                      fill={PALETTE_GRAPHIQUE[index % PALETTE_GRAPHIQUE.length]}
                      stackId={empilee ? 'stack' : undefined}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </>
              ) : (
                <Bar 
                  dataKey={cleY} 
                  fill={couleur}
                  radius={[2, 2, 0, 0]}
                />
              )}
            </BarChartComponent>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Graphique en secteurs (camembert) amélioré
 */
interface PropsGraphiqueSecteurs extends PropsGraphiqueBase {
  cleValeur: string
  cleLibelle: string
  afficherPourcentages?: boolean
  rayonInterieur?: number
  formater?: (valeur: any) => string
}

export function GraphiqueSecteurs({
  titre,
  sousTitre,
  donnees,
  hauteur = 300,
  chargement = false,
  cleValeur,
  cleLibelle,
  afficherPourcentages = true,
  rayonInterieur = 0,
  formater = (valeur) => valeur?.toString() || '0'
}: PropsGraphiqueSecteurs) {
  const total = donnees.reduce((sum, item) => sum + (item[cleValeur] || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">{titre}</div>
            {sousTitre && <div className="text-sm text-gray-600 mt-1">{sousTitre}</div>}
          </div>
          <Badge variant="outline">
            Total: {formater(total)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chargement ? (
          <div className="flex items-center justify-center" style={{ height: hauteur }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : donnees.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: hauteur }}>
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-2/3">
              <ResponsiveContainer width="100%" height={hauteur}>
                <PieChart>
                  <Pie
                    data={donnees}
                    cx="50%"
                    cy="50%"
                    innerRadius={rayonInterieur}
                    outerRadius={Math.min(hauteur / 2 - 20, 120)}
                    paddingAngle={2}
                    dataKey={cleValeur}
                    label={afficherPourcentages ? ({ [cleLibelle]: libelle, [cleValeur]: valeur }) => {
                      const pourcentage = total > 0 ? ((valeur / total) * 100).toFixed(1) : '0'
                      return `${libelle}: ${pourcentage}%`
                    } : false}
                    labelLine={false}
                  >
                    {donnees.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PALETTE_GRAPHIQUE[index % PALETTE_GRAPHIQUE.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(valeur, nom) => [formater(valeur), nom]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Légende personnalisée */}
            <div className="w-full lg:w-1/3 mt-4 lg:mt-0 lg:ml-4">
              <div className="space-y-2">
                {donnees.map((item, index) => {
                  const pourcentage = total > 0 ? ((item[cleValeur] / total) * 100).toFixed(1) : '0'
                  return (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PALETTE_GRAPHIQUE[index % PALETTE_GRAPHIQUE.length] }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {item[cleLibelle]}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formater(item[cleValeur])}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pourcentage}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Graphique linéaire multi-séries pour les tendances
 */
interface PropsGraphiqueLignes extends PropsGraphiqueBase {
  cleX: string
  series: Array<{
    cle: string
    nom: string
    couleur?: string
  }>
  afficherPointsUniquement?: boolean
  formater?: (valeur: any) => string
}

export function GraphiqueLignes({
  titre,
  sousTitre,
  donnees,
  hauteur = 300,
  chargement = false,
  cleX,
  series,
  afficherPointsUniquement = false,
  formater = (valeur) => valeur?.toString() || '0'
}: PropsGraphiqueLignes) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div>
            <div className="text-lg font-semibold text-gray-900">{titre}</div>
            {sousTitre && <div className="text-sm text-gray-600 mt-1">{sousTitre}</div>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chargement ? (
          <div className="flex items-center justify-center" style={{ height: hauteur }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : donnees.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: hauteur }}>
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={hauteur}>
            <LineChart data={donnees}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey={cleX}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip 
                formatter={(valeur, nom) => [formater(valeur), nom]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              {series.map((serie, index) => (
                <Line
                  key={serie.cle}
                  type="monotone"
                  dataKey={serie.cle}
                  stroke={serie.couleur || PALETTE_GRAPHIQUE[index % PALETTE_GRAPHIQUE.length]}
                  strokeWidth={2}
                  dot={afficherPointsUniquement ? { fill: serie.couleur || PALETTE_GRAPHIQUE[index], strokeWidth: 2, r: 4 } : false}
                  connectNulls={false}
                  name={serie.nom}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Carte métrique avec tendance et icône
 */
interface PropsCarteMetrique {
  titre: string
  valeur: number | string
  tendance?: number
  icone?: React.ComponentType<any>
  couleur?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  formatage?: 'nombre' | 'euro' | 'pourcentage' | 'duree'
  suffixe?: string
}

export function CarteMetrique({
  titre,
  valeur,
  tendance,
  icone: Icone,
  couleur = 'blue',
  formatage = 'nombre',
  suffixe
}: PropsCarteMetrique) {
  const formaterValeur = (val: number | string) => {
    if (typeof val === 'string') return val
    
    switch (formatage) {
      case 'euro':
        return `€${val.toLocaleString('fr-FR')}`
      case 'pourcentage':
        return `${val}%`
      case 'duree':
        return `${val}h`
      default:
        return val.toLocaleString('fr-FR')
    }
  }

  const couleursTheme = {
    blue: {
      fond: 'bg-blue-50 border-blue-200',
      icone: 'text-blue-600 bg-blue-100',
      texte: 'text-blue-900'
    },
    green: {
      fond: 'bg-green-50 border-green-200',
      icone: 'text-green-600 bg-green-100',
      texte: 'text-green-900'
    },
    purple: {
      fond: 'bg-purple-50 border-purple-200',
      icone: 'text-purple-600 bg-purple-100',
      texte: 'text-purple-900'
    },
    orange: {
      fond: 'bg-orange-50 border-orange-200',
      icone: 'text-orange-600 bg-orange-100',
      texte: 'text-orange-900'
    },
    red: {
      fond: 'bg-red-50 border-red-200',
      icone: 'text-red-600 bg-red-100',
      texte: 'text-red-900'
    }
  }

  const theme = couleursTheme[couleur]

  return (
    <Card className={`${theme.fond} border transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{titre}</p>
            <div className="flex items-baseline space-x-2">
              <p className={`text-2xl font-bold ${theme.texte}`}>
                {formaterValeur(valeur)}
              </p>
              {suffixe && (
                <span className="text-sm text-gray-500">{suffixe}</span>
              )}
            </div>
            {tendance !== undefined && (
              <div className="flex items-center space-x-1">
                {tendance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  tendance >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {tendance >= 0 ? '+' : ''}{tendance.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">vs mois précédent</span>
              </div>
            )}
          </div>
          {Icone && (
            <div className={`p-3 rounded-full ${theme.icone}`}>
              <Icone className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Tableau de données avec tri et pagination intégrés
 */
interface PropsTableauDonnees {
  titre: string
  donnees: any[]
  colonnes: Array<{
    cle: string
    libelle: string
    largeur?: string
    alignement?: 'left' | 'center' | 'right'
    formater?: (valeur: any, ligne: any) => React.ReactNode
    triable?: boolean
  }>
  chargement?: boolean
  lignesParPage?: number
}

export function TableauDonnees({
  titre,
  donnees,
  colonnes,
  chargement = false,
  lignesParPage = 10
}: PropsTableauDonnees) {
  const [tri, setTri] = React.useState<{ cle: string; direction: 'asc' | 'desc' } | null>(null)
  const [pageActuelle, setPageActuelle] = React.useState(1)

  // Tri des données
  const donneesTri = React.useMemo(() => {
    if (!tri) return donnees

    return [...donnees].sort((a, b) => {
      const valeurA = a[tri.cle]
      const valeurB = b[tri.cle]

      let comparaison = 0
      if (valeurA < valeurB) comparaison = -1
      if (valeurA > valeurB) comparaison = 1

      return tri.direction === 'asc' ? comparaison : -comparaison
    })
  }, [donnees, tri])

  // Pagination
  const donneesPage = React.useMemo(() => {
    const debut = (pageActuelle - 1) * lignesParPage
    return donneesTri.slice(debut, debut + lignesParPage)
  }, [donneesTri, pageActuelle, lignesParPage])

  const nombrePages = Math.ceil(donneesTri.length / lignesParPage)

  const gererTri = (cleColonne: string) => {
    setTri(prev => {
      if (prev?.cle === cleColonne) {
        return prev.direction === 'asc' ? { cle: cleColonne, direction: 'desc' } : null
      }
      return { cle: cleColonne, direction: 'asc' }
    })
    setPageActuelle(1) // Retour à la première page lors du tri
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">{titre}</CardTitle>
          <Badge variant="outline">
            {donneesTri.length} {donneesTri.length <= 1 ? 'élément' : 'éléments'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {chargement ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : donnees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    {colonnes.map((colonne) => (
                      <th
                        key={colonne.cle}
                        className={`p-3 font-medium text-gray-700 ${
                          colonne.alignement === 'right' ? 'text-right' :
                          colonne.alignement === 'center' ? 'text-center' : 'text-left'
                        } ${colonne.triable ? 'cursor-pointer hover:bg-gray-50 select-none' : ''}`}
                        style={{ width: colonne.largeur }}
                        onClick={() => colonne.triable && gererTri(colonne.cle)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{colonne.libelle}</span>
                          {colonne.triable && tri?.cle === colonne.cle && (
                            <span className="text-purple-600">
                              {tri.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donneesPage.map((ligne, indexLigne) => (
                    <tr key={indexLigne} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      {colonnes.map((colonne) => (
                        <td
                          key={colonne.cle}
                          className={`p-3 ${
                            colonne.alignement === 'right' ? 'text-right' :
                            colonne.alignement === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {colonne.formater 
                            ? colonne.formater(ligne[colonne.cle], ligne)
                            : ligne[colonne.cle] || '-'
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {nombrePages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Affichage {((pageActuelle - 1) * lignesParPage) + 1} à {Math.min(pageActuelle * lignesParPage, donneesTri.length)} sur {donneesTri.length}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPageActuelle(prev => Math.max(1, prev - 1))}
                    disabled={pageActuelle === 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  {Array.from({ length: Math.min(5, nombrePages) }, (_, i) => {
                    let numeroPage
                    if (nombrePages <= 5) {
                      numeroPage = i + 1
                    } else if (pageActuelle <= 3) {
                      numeroPage = i + 1
                    } else if (pageActuelle >= nombrePages - 2) {
                      numeroPage = nombrePages - 4 + i
                    } else {
                      numeroPage = pageActuelle - 2 + i
                    }
                    
                    return (
                      <button
                        key={numeroPage}
                        onClick={() => setPageActuelle(numeroPage)}
                        className={`px-3 py-1 text-sm border rounded ${
                          pageActuelle === numeroPage
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {numeroPage}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPageActuelle(prev => Math.min(nombrePages, prev + 1))}
                    disabled={pageActuelle === nombrePages}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Widget de KPI avec comparaison et sparkline
 */
interface PropsWidgetKPI {
  titre: string
  valeurActuelle: number
  valeurPrecedente?: number
  donneesTendance?: number[]
  formatage?: 'nombre' | 'euro' | 'pourcentage'
  couleur?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  objectif?: number
}

export function WidgetKPI({
  titre,
  valeurActuelle,
  valeurPrecedente,
  donneesTendance = [],
  formatage = 'nombre',
  couleur = 'blue',
  objectif
}: PropsWidgetKPI) {
  const formaterValeur = (val: number) => {
    switch (formatage) {
      case 'euro':
        return `€${val.toLocaleString('fr-FR')}`
      case 'pourcentage':
        return `${val}%`
      default:
        return val.toLocaleString('fr-FR')
    }
  }

  const calculerTendance = () => {
    if (valeurPrecedente === undefined) return null
    const changement = valeurActuelle - valeurPrecedente
    const pourcentageChangement = valeurPrecedente !== 0 ? (changement / valeurPrecedente) * 100 : 0
    return { changement, pourcentageChangement }
  }

  const calculerProgressionObjectif = () => {
    if (objectif === undefined) return null
    return Math.min((valeurActuelle / objectif) * 100, 100)
  }

  const tendance = calculerTendance()
  const progressionObjectif = calculerProgressionObjectif()

  const couleursTheme = {
    blue: { principal: '#3b82f6', fond: 'bg-blue-50', barre: 'bg-blue-600' },
    green: { principal: '#10b981', fond: 'bg-green-50', barre: 'bg-green-600' },
    purple: { principal: '#8b5cf6', fond: 'bg-purple-50', barre: 'bg-purple-600' },
    orange: { principal: '#f59e0b', fond: 'bg-orange-50', barre: 'bg-orange-600' },
    red: { principal: '#ef4444', fond: 'bg-red-50', barre: 'bg-red-600' }
  }

  const theme = couleursTheme[couleur]

  return (
    <Card className={`${theme.fond} border transition-all duration-200 hover:shadow-lg`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* En-tête */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{titre}</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                {formaterValeur(valeurActuelle)}
              </span>
              {tendance && (
                <div className={`flex items-center space-x-1 ${
                  tendance.pourcentageChangement >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tendance.pourcentageChangement >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {Math.abs(tendance.pourcentageChangement).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Barre de progression vers l'objectif */}
          {progressionObjectif !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Objectif: {formaterValeur(objectif!)}</span>
                <span>{progressionObjectif.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${theme.barre} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${progressionObjectif}%` }}
                />
              </div>
            </div>
          )}

          {/* Mini graphique de tendance */}
          {donneesTendance.length > 0 && (
            <div className="h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donneesTendance.map((val, idx) => ({ value: val, index: idx }))}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={theme.principal}
                    fill={theme.principal}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}