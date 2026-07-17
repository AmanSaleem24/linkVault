// Barrel re-export — keeps all existing imports stable.
// New implementations live in focused sibling files.

import { createLinkAction, invalidateCache } from './links.create'
import { updateLinkAction } from './links.update'
import { deleteLinkAction, toggleLinkStatusAction } from './links.delete'
import { getUserLinksAction, getUserUsageStatsAction, checkAliasAvailabilityAction } from './links.read'

export { createLinkAction, invalidateCache }
export { updateLinkAction }
export { deleteLinkAction, toggleLinkStatusAction }
export { getUserLinksAction, getUserUsageStatsAction, checkAliasAvailabilityAction }
