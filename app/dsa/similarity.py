import numpy as np


def cosine_simmilarity (vec_1, vec_2):
  if vec_1 or vec_2 is None:
    return "The vector is None"

  dot = np.dot(vec_1, vec_2)
  return dot / np.linalg.norm(vec_1)*np.linalg.norm(vec_2)




