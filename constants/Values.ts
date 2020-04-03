export default {
  DEBUG:true,
  ratio: 16 / 9,
	worldSpaceHeight: 1240,//Math.max(gl.drawingBufferHeight,300);//1240
	worldSpaceWidth:2204,//worldSpaceHeight * ratio,//2204.44444
  score:0,
  maxScore:0,
  boardsCount:40,
  boardWidth:150,
  boardHeight:20,
  boardRotateSpeedRange:0.1,
  boardSpeedRange:800,
  playerSpeed:10,
  playerSize:50,
  jumpHeight:20,
  gravity:-9.8,
  currentPlayerSpeed:0,
  canvasView:null,
  pickupPopupBoarderX:200,
  pickupPopupBoarderY:100,
  pickupSize:50,
  msgs:[],
  timeForMessage:3000,
};
