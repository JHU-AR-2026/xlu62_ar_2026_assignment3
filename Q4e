import numpy as np


def camera_to_pixel(Pc, W, H, n, f, fx, fy, ox, oy):

    # OpenGL projection matrix
    P = np.array([
        [2 * fx / W, 0,              2 * ox / W - 1, 0],
        [0,          2 * fy / H,     1 - 2 * oy / H, 0],
        [0,          0,             -(f + n) / (f - n),
                                      -2 * f * n / (f - n)],
        [0,          0,             -1,              0]
    ], dtype=float)

    # Camera coordinates -> clip coordinates
    Pc = np.asarray(Pc, dtype=float)
    Pclip = P @ Pc

    # Perspective divide: clip -> NDC
    Pndc = Pclip[:3] / Pclip[3]

    # NDC -> pixel coordinates
    u = 0.5 * (Pndc[0] + 1.0) * W
    v = 0.5 * (Pndc[1] + 1.0) * H

    return np.array([u, v])


# Example from the problem
Pc = np.array([0.3, -0.15, -6.0, 1.0])

uv = camera_to_pixel(
    Pc,
    W=800,
    H=600,
    n=0.2,
    f=20,
    fx=800,
    fy=800,
    ox=400,
    oy=400
)

print(uv)
