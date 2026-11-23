using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    [Header("Doel")]
    [SerializeField] private Transform target;

    [Header("Camera")]
    [SerializeField] private Vector3 offset = new Vector3(0f, 3f, -5f);
    [SerializeField] private float followSmoothness = 8f;
    [SerializeField] private float lookHeight = 1.4f;

    private void LateUpdate()
    {
        if (target == null)
            return;

        Vector3 wantedPosition = target.position + offset;
        transform.position = Vector3.Lerp(
            transform.position,
            wantedPosition,
            followSmoothness * Time.deltaTime);

        transform.LookAt(target.position + Vector3.up * lookHeight);
    }

    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
    }
}
