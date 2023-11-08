export enum GameInputKey {
  BUTTON_1 = 'button_1',
  BUTTON_2 = 'button_2',
  BUTTON_3 = 'button_3',
  BUTTON_4 = 'button_4',
  SHOULDER_TOP_LEFT = 'shoulder_top_left',
  SHOULDER_TOP_RIGHT = 'shoulder_top_right',
  SHOULDER_BOTTOM_LEFT = 'shoulder_bottom_left',
  SHOULDER_BOTTOM_RIGHT = 'shoulder_bottom_right',
  SELECT = 'select',
  START = 'start',
  STICK_LEFT = 'stick_button_left',
  STICK_RIGHT = 'stick_button_right',
  D_PAD_UP = 'd_pad_up',
  D_PAD_DOWN = 'd_pad_down',
  D_PAD_LEFT = 'd_pad_left',
  D_PAD_RIGHT = 'd_pad_right',
}

export enum GameInputAxe {
  STICK_LEFT = 'stick_axis_left',
  STICK_RIGHT = 'stick_axis_right',
}

export const GAME_INPUT_KEY_ALL: GameInputKey[] = [
  GameInputKey.BUTTON_1,
  GameInputKey.BUTTON_2,
  GameInputKey.BUTTON_3,
  GameInputKey.BUTTON_4,
  GameInputKey.SHOULDER_TOP_LEFT,
  GameInputKey.SHOULDER_TOP_RIGHT,
  GameInputKey.SHOULDER_BOTTOM_LEFT,
  GameInputKey.SHOULDER_BOTTOM_RIGHT,
  GameInputKey.SELECT,
  GameInputKey.START,
  GameInputKey.STICK_LEFT,
  GameInputKey.STICK_RIGHT,
  GameInputKey.D_PAD_UP,
  GameInputKey.D_PAD_DOWN,
  GameInputKey.D_PAD_LEFT,
  GameInputKey.D_PAD_RIGHT,
];
export const GAME_INPUT_KEY_ALL_D_PAD: GameInputKey[] = [
  GameInputKey.D_PAD_UP,
  GameInputKey.D_PAD_DOWN,
  GameInputKey.D_PAD_LEFT,
  GameInputKey.D_PAD_RIGHT,
];
export const GAME_INPUT_KEY_ALL_BUTTONS: GameInputKey[] = [
  GameInputKey.BUTTON_1,
  GameInputKey.BUTTON_2,
  GameInputKey.BUTTON_3,
  GameInputKey.BUTTON_4,
  GameInputKey.SELECT,
  GameInputKey.START,
];

export const GAME_INPUT_AXE_ALL: GameInputAxe[] = [GameInputAxe.STICK_LEFT, GameInputAxe.STICK_RIGHT];

export const GAME_INPUT_KEY_ALL_STICKS: GameInputKey[] = [GameInputKey.STICK_LEFT, GameInputKey.STICK_RIGHT];

export type GameInputKeyMap = {
  [key in GameInputKey]: number | number[];
};

export type GameInputPressState = {
  [key in GameInputKey]: boolean;
};

export type GameInputAxesState = {
  [key in GameInputAxe]: number[];
};

export interface GameInputKeyEvent{
  stage: GameInputEventStage;
  key: GameInputKey;
  inputId: InputId;
}

export interface GameInputAxeEvent{
  stage: GameInputEventStage;
  axe: GameInputAxe;
  inputId: InputId;
  value:  number[];
}

export interface GameInputKeyListenner{
  stage: GameInputEventStage;
  key: GameInputKey;
}

export enum GameInputEventStage {
  PRESS = 'press',
  HOLD = 'hold',
  RELEASE = 'release',
}

export enum GamepadConnectEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
}


export enum InputId {
  Keyboard = 100,
  Player1 = 0,
  Player2 = 1,
  Player3 = 2,
  Player4 = 3,
}

export type KeyboardKeyMapping = {
  [name in GameInputKey]: string[]
}

export type GamepadKeyMapping = {
  [name in GameInputKey]: number
}

export type GamepadAxeMapping = {
  [name in GameInputAxe]: number[]

}