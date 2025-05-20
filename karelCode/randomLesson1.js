//Karel knows a condition "random"
//that returns yes half of the time!
function main() {
while (frontIsClear()) {
if (noBeepersPresent()) {
  putBeeper();
}
if (random()) {
  turnLeft();
} else {
  move();
}
}
}
