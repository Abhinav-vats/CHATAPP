import tensorflow as tf
import numpy as np

#100 phony y, x data points are created in NumPy, y = 0.3 + x * 0.1
x_data = np.random.rand(100).astype(np.float32)
y_data = x_data * 0.1 + 0.3

# calculate y_data = b + W * x_data, by finding the values for b and W
# Knowing that b should be 0.3 and W 0.1, but it will be figured out by  the tensorflow
W = tf.Variable(tf.random_uniform([1], -1.0, 1.0))
b = tf.Variable(tf.zeros([1]))
y = W * x_data + b

# Minimize the mean squared errors.
loss = tf.reduce_mean(tf.square(y - y_data))
optimizer = tf.train.GradientDescentOptimizer(0.5)
train = optimizer.minimize(loss)

# Before starting, initialize the variables.  We will 'run' this first.
init = tf.initialize_all_variables()

# Launch the graph.
sess = tf.Session()
sess.run(init)

# Fit the line.
for step in xrange(201):
    sess.run(train)
    if step % 20 == 0:
        print(step, sess.run(W), sess.run(b))

# Learns best fit is W: [0.1], b: [0.