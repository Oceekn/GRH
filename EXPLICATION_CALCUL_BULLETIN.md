# 📊 Explication du Calcul Automatique du Bulletin de Paie

Ce document explique en détail comment fonctionne le calcul automatique dans le formulaire de génération de bulletin de paie.

## 🔄 Vue d'ensemble

Le calcul se fait **en temps réel** lorsque vous remplissez le formulaire. Dès que vous modifiez un champ (employé, primes, retenues, heures supplémentaires, avances), les valeurs sont recalculées automatiquement.

---

## 📝 Étapes du Calcul

### **1. Données de Base**

Le calcul commence avec :
- **Salaire de base** : Récupéré automatiquement depuis les informations de l'employé sélectionné
- **Primes** : Saisie manuelle (par défaut : 0)
- **Retenues diverses** : Saisie manuelle (par défaut : 0)
- **Heures supplémentaires** : Saisie manuelle en heures (par défaut : 0)
- **Avances sur salaire** : Saisie manuelle (par défaut : 0)

---

### **2. Calcul des Heures Supplémentaires**

**Formule :**
```
Taux horaire = Salaire de base ÷ 173.33 heures
Paiement heures sup = Taux horaire × Nombre d'heures × 1.5
```

**Explication :**
- **173.33 heures** = Nombre moyen d'heures travaillées par mois (40h/semaine × 52 semaines ÷ 12 mois)
- **1.5** = Coefficient multiplicateur pour les heures supplémentaires (50% de majoration)
- Le taux horaire est calculé en divisant le salaire mensuel par le nombre d'heures mensuelles

**Exemple :**
- Salaire de base : 2 500 000 FCFA
- Heures supplémentaires : 10 heures
- Taux horaire = 2 500 000 ÷ 173.33 = 14 423 FCFA/heure
- Paiement heures sup = 14 423 × 10 × 1.5 = **216 345 FCFA**

---

### **3. Calcul du Salaire Brut**

**Formule :**
```
Salaire brut = Salaire de base + Primes + Paiement heures supplémentaires
```

**Exemple :**
- Salaire de base : 2 500 000 FCFA
- Primes : 50 000 FCFA
- Paiement heures sup : 216 345 FCFA
- **Salaire brut = 2 500 000 + 50 000 + 216 345 = 2 766 345 FCFA**

---

### **4. Calcul des Cotisations Sociales**

**Formule actuelle :**
```
Cotisations sociales = Salaire de base × 11%
```

**Note :** 
- Si une fonction `calculateSocialContributions()` existe dans `modules.js`, elle sera utilisée à la place
- Sinon, le calcul par défaut est de **11% du salaire de base**

**Exemple :**
- Salaire de base : 2 500 000 FCFA
- **Cotisations sociales = 2 500 000 × 0.11 = 275 000 FCFA**

---

### **5. Calcul des Impôts**

**Formule actuelle :**
```
Impôts = 0 (par défaut)
```

**Note :**
- Si une fonction `calculateTaxes()` existe dans `modules.js`, elle sera utilisée
- Sinon, les impôts sont à **0 FCFA** par défaut

**Pour calculer les impôts, vous pouvez ajouter une fonction dans `modules.js` :**
```javascript
function calculateTaxes(grossSalary) {
    // Exemple de calcul d'impôts progressif
    if (grossSalary <= 1000000) {
        return 0;
    } else if (grossSalary <= 2000000) {
        return (grossSalary - 1000000) * 0.10; // 10% sur la tranche
    } else {
        return 100000 + (grossSalary - 2000000) * 0.15; // 15% sur la tranche supérieure
    }
}
```

---

### **6. Calcul du Salaire Net**

**Formule :**
```
Salaire net = Salaire brut - Cotisations sociales - Impôts - Retenues diverses - Avances sur salaire
```

**Exemple complet :**
- Salaire de base : 2 500 000 FCFA
- Primes : 50 000 FCFA
- Heures supplémentaires (10h) : 216 345 FCFA
- **Salaire brut : 2 766 345 FCFA**
- Cotisations sociales (11%) : 275 000 FCFA
- Impôts : 0 FCFA
- Retenues diverses : 0 FCFA
- Avances sur salaire : 0 FCFA
- **Salaire net = 2 766 345 - 275 000 - 0 - 0 - 0 = 2 491 345 FCFA**

---

## 🎯 Affichage en Temps Réel

Dans le formulaire, vous verrez automatiquement :

```
┌─────────────────────────────────────┐
│ Calcul automatique :                 │
│                                      │
│ Cotisations sociales : 275 000 FCFA  │
│ Impôts : 0 FCFA                      │
│                                      │
│ ─────────────────────────────────    │
│ Salaire net : 2 491 345 FCFA         │
└─────────────────────────────────────┘
```

Ces valeurs se mettent à jour **instantanément** quand vous modifiez :
- L'employé sélectionné (change le salaire de base)
- Les primes
- Les retenues
- Les heures supplémentaires
- Les avances

---

## ⚙️ Paramètres Configurables

### Taux des Heures Supplémentaires
Actuellement fixé à **1.5** (50% de majoration)
- Modifiable dans le code : ligne `const overtimeRate = 1.5;`

### Taux des Cotisations Sociales
Actuellement fixé à **11%** du salaire de base
- Modifiable dans le code : ligne `baseSalary * 0.11`
- Ou personnalisable via la fonction `calculateSocialContributions()` dans `modules.js`

### Nombre d'Heures Mensuelles
Actuellement fixé à **173.33 heures**
- Calcul : 40h/semaine × 52 semaines ÷ 12 mois = 173.33h
- Modifiable dans le code : ligne `baseSalary / 173.33`

---

## 📋 Ordre des Calculs

1. ✅ Récupération du salaire de base de l'employé
2. ✅ Calcul du paiement des heures supplémentaires
3. ✅ Calcul du salaire brut (base + primes + heures sup)
4. ✅ Calcul des cotisations sociales (11% du salaire de base)
5. ✅ Calcul des impôts (0 par défaut, ou fonction personnalisée)
6. ✅ Calcul du salaire net (brut - cotisations - impôts - retenues - avances)

---

## 🔧 Personnalisation

Pour personnaliser les calculs, vous pouvez créer/modifier les fonctions dans `modules.js` :

### Exemple : Cotisations Sociales Détaillées
```javascript
function calculateSocialContributions(baseSalary) {
    return {
        cnss: baseSalary * 0.05,        // 5% CNSS
        retraite: baseSalary * 0.04,   // 4% Retraite
        assurance: baseSalary * 0.02,  // 2% Assurance
        total: baseSalary * 0.11        // Total 11%
    };
}
```

### Exemple : Calcul d'Impôts Progressif
```javascript
function calculateTaxes(grossSalary) {
    // Barème d'imposition progressif
    if (grossSalary <= 1000000) {
        return 0;
    } else if (grossSalary <= 2000000) {
        return (grossSalary - 1000000) * 0.10;
    } else if (grossSalary <= 5000000) {
        return 100000 + (grossSalary - 2000000) * 0.15;
    } else {
        return 550000 + (grossSalary - 5000000) * 0.20;
    }
}
```

---

## ✅ Validation

Lorsque vous cliquez sur **"Générer le bulletin"**, le système :
1. Vérifie que tous les champs obligatoires sont remplis
2. Effectue les mêmes calculs une dernière fois
3. Génère un numéro de bulletin unique (format : `BULL-YYYYMM-XXXX`)
4. Enregistre le bulletin dans la base de données
5. Génère et télécharge automatiquement le PDF

---

## 📌 Notes Importantes

- ⚠️ Les calculs sont effectués **côté client** (dans le navigateur)
- ⚠️ Pour une application de production, il est recommandé de valider les calculs **côté serveur**
- ⚠️ Les taux (cotisations, impôts) peuvent varier selon la législation locale
- ⚠️ Les heures supplémentaires peuvent avoir des taux différents selon les heures travaillées (nuit, week-end, jours fériés)

---

**Dernière mise à jour :** 2025


