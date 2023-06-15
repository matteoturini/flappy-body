# flappy-body

Flappy Body is an interactive approach to remaking the famous game Flappy Bird. Me and @aristek1 have programmed a body detection algorhithm in it, so that you can become the bird.

# How to use
1. Open https://flappy-body.pages.dev/
2. Wait for it to load
3. Start flapping your arms in front of your camera

# How does it work?

We use a popular pose detection algorithm from MediaPipe to recognize the player pose. Then, we pass these estimations to our flap detection and speed estimation algorithms. Then, the main game loop calculates the player speed and collision with eventual pipes.
![image](https://github.com/matteoturini/flappy-body/assets/69425093/bcdc18ed-c557-45ae-9f72-a746d8a0c63d)
