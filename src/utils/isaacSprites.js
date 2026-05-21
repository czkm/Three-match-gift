import { ISAAC_ITEM_BY_REWARD_ID } from '@/data/isaacItems';

export function getIsaacItemMetaByRewardId(rewardItemId) {
  return ISAAC_ITEM_BY_REWARD_ID[rewardItemId] || null;
}
