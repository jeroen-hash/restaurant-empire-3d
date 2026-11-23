using UnityEngine;

#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

[RequireComponent(typeof(CharacterController))]
public class PlayerMovement : MonoBehaviour
{
    [Header("Beweging")]
    [SerializeField] private float moveSpeed = 4f;
    [SerializeField] private float gravity = -20f;
    [SerializeField] private float rotationSpeed = 12f;

    private CharacterController controller;
    private Vector3 verticalVelocity;

    private void Awake()
    {
        controller = GetComponent<CharacterController>();
    }

    private void Update()
    {
        Vector2 input = ReadArrowKeys();
        Vector3 direction = new Vector3(input.x, 0f, input.y);

        if (direction.sqrMagnitude > 1f)
            direction.Normalize();

        if (direction.sqrMagnitude > 0.001f)
        {
            Quaternion wantedRotation = Quaternion.LookRotation(direction, Vector3.up);
            transform.rotation = Quaternion.Slerp(
                transform.rotation, wantedRotation, rotationSpeed * Time.deltaTime);

            controller.Move(direction * moveSpeed * Time.deltaTime);
        }

        if (controller.isGrounded && verticalVelocity.y < 0f)
            verticalVelocity.y = -2f;

        verticalVelocity.y += gravity * Time.deltaTime;
        controller.Move(verticalVelocity * Time.deltaTime);
    }

    private Vector2 ReadArrowKeys()
    {
        Vector2 input = Vector2.zero;

#if ENABLE_INPUT_SYSTEM
        if (Keyboard.current != null)
        {
            if (Keyboard.current.leftArrowKey.isPressed)  input.x -= 1f;
            if (Keyboard.current.rightArrowKey.isPressed) input.x += 1f;
            if (Keyboard.current.downArrowKey.isPressed)  input.y -= 1f;
            if (Keyboard.current.upArrowKey.isPressed)    input.y += 1f;
            return input;
        }
#endif

#if ENABLE_LEGACY_INPUT_MANAGER
        if (Input.GetKey(KeyCode.LeftArrow))  input.x -= 1f;
        if (Input.GetKey(KeyCode.RightArrow)) input.x += 1f;
        if (Input.GetKey(KeyCode.DownArrow))  input.y -= 1f;
        if (Input.GetKey(KeyCode.UpArrow))    input.y += 1f;
#endif
        return input;
    }
}
