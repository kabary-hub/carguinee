# ADR-005 : Chiffrement des données sensibles (RGPD)

**Statut** : Accepté  
**Date** : 2025  
**Décideurs** : Équipe CarGuinée

## Contexte

La réglementation RGPD exige la protection des données personnelles. Les numéros de téléphone et emails sont des données sensibles.

## Décision

- **Algorithme** : AES-256-GCM (via Node.js `crypto`)
- **Clé** : `ENCRYPTION_KEY` (64 caractères hex = 32 octets), stockée en variable d'env
- **Données chiffrées** : téléphone, email (quand applicable)
- **Validation** : La clé ne peut pas être la valeur par défaut (0x00...00)
- **Génération** : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Alternatives considérées

- **Chiffrement au repos (disk)** : Déjà couvert par le cloud provider
- **Tokenisation** : Overkill pour ce cas d'usage
- **Pas de chiffrement** : Non conforme RGPD

## Conséquences

- ✅ Conformité RGPD renforcée
- ✅ Les données sensibles sont protégées même en cas de fuite DB
- ⚠️ Performance : déchiffrement à chaque lecture
- ⚠️ Si la clé est perdue, les données sont irrécupérables
