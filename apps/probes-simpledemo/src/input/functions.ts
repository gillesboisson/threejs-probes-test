import { GameInputAxesState, GameInputKey, GameInputPressState, GAME_INPUT_AXE_ALL, GAME_INPUT_KEY_ALL } from './types';


export function resetInputPressState(state: GameInputPressState = {} as any): GameInputPressState{
  for(const key of GAME_INPUT_KEY_ALL){
    state[key] = false;
  }

  return state;
}

export function resetInputAxesState(state: GameInputAxesState = {} as any): GameInputAxesState{
  return {
    stick_axis_left:state.stick_axis_left || [0,0],
    stick_axis_right:state.stick_axis_right || [0,0],
  };
}

export function gamepadAxeIsOffPosition(axes: number[], offThreshold = 0.3): boolean {
  return (!axes[0] || Math.abs(axes[0]) < offThreshold) && (!axes[1] || Math.abs(axes[1]) < offThreshold);
}