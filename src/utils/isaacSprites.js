import { ISAAC_ITEM_BY_REWARD_ID, ISAAC_SPRITE_SHEET } from '@/data/isaacItems';

export function getIsaacItemMetaByRewardId(rewardItemId) {
  return ISAAC_ITEM_BY_REWARD_ID[rewardItemId] || null;
}

export function getIsaacSpriteStyleByRewardId(rewardItemId, size = 32) {
  const item = getIsaacItemMetaByRewardId(rewardItemId);
  if (!item?.sprite) return null;

  return {
    width: `${size}px`,
    height: `${size}px`,
    display: 'inline-block',
    flex: '0 0 auto',
    backgroundImage: `url(${ISAAC_SPRITE_SHEET.url})`,
    backgroundPosition: item.sprite.backgroundPosition,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${ISAAC_SPRITE_SHEET.width}px ${ISAAC_SPRITE_SHEET.height}px`,
    imageRendering: 'pixelated'
  };
}
