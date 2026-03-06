#include <Servo.h>\nServo myservo;\nvoid setup() { myservo.attach(9); }\nvoid loop() { myservo.write(90); }
