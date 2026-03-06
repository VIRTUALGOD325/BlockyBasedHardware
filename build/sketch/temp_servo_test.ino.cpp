#include <Arduino.h>
#line 1 "/Users/tanishqnabar/Developer/EduPrime/blockly-hardware/BlockyBasedHardware/temp_servo_test/temp_servo_test.ino"
#include <Servo.h>\nServo myservo;\nvoid setup() { myservo.attach(9); }\nvoid loop() { myservo.write(90); }

