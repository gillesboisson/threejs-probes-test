import {
  AdditiveBlending,
  BufferGeometry,
  CircleGeometry,
  Float32BufferAttribute,
  Group,
  Intersection,
  Line,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  Renderer,
  RingGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
  XRTargetRaySpace,
} from 'three'
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'

type ControllerEvent = { data: XRInputSource; target: XRTargetRaySpace }


export class AppNavigation {
  protected room: LineSegments<BoxLineGeometry, LineBasicMaterial>
  protected marker: Mesh<CircleGeometry, MeshBasicMaterial>
  protected floor: Mesh<PlaneGeometry, MeshBasicMaterial>
  protected raycaster: Raycaster = new Raycaster()

  private _intersection: Vector3 | null = null
  private _selectedController: XRTargetRaySpace | null = null
  private _tempMatrix = new Matrix4()

  protected controllers: XRTargetRaySpace[] = []
  protected sessionStarted = false

  private _onSelectStart = (e: ControllerEvent) => this.onSelectStart(e.target)
  private _onSelectEnd = (e: ControllerEvent) => this.onSelectEnd()
  private _buildController = (e: ControllerEvent) =>
    e.target.add(this.buildController(e.data))

  private _releaseController = (e: ControllerEvent) => {
    this.releaseController(e.data)
    e.target.remove(...e.target.children)
  }
  protected collisionObjects: Object3D[]
  protected controllerGroup: Group
  protected baseReferenceSpace: XRReferenceSpace

  constructor(
    readonly renderer: WebGLRenderer,
    readonly scene: Scene,
    collisionObjects: Object3D[] = [],
    readonly startPosition = new Vector3(0, 0, 0),
    readonly startRotation = new Quaternion()
  ) {
    this.initObjects()
    // this.initControllers()

    renderer.xr.addEventListener('sessionstart', () => {
      this.initControllers()

      if (!this.baseReferenceSpace) {
        this.baseReferenceSpace = renderer.xr.getReferenceSpace()
      }

      this.sessionStarted = true
      this.teleport(startPosition, true)
    })

    renderer.xr.addEventListener('sessionend', () => {
      this.reset()
      this.sessionStarted = false
    })

    this.collisionObjects = [...collisionObjects, this.floor]
  }

  protected teleport(position: Vector3, absolute = false): void {
    const referenceSpace = absolute
      ? this.baseReferenceSpace
      : this.renderer.xr.getReferenceSpace()

    const camPosition = absolute
      ? position.clone()
      : position.clone().sub(this.renderer.xr.getCamera().position)

    const transform = new XRRigidTransform({
      x: -camPosition.x,
      y: 0,
      z: -camPosition.z,
      w: 1,
    })

    const teleportSpaceOffset =
      referenceSpace.getOffsetReferenceSpace(transform)

    this.renderer.xr.setReferenceSpace(teleportSpaceOffset)

    console.log('position', position)
  }

  protected reset() {
    this.marker.position.set(0, 0, 0)
    this.marker.visible = false
    this.releaseControllers()
  }

  protected initObjects() {
    this.room = new LineSegments(
      new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
      new LineBasicMaterial({ color: 0xbcbcbc })
    )

    this.marker = new Mesh(
      new CircleGeometry(0.25, 32).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ color: 0xbcbcbc })
    )

    this.marker.visible = false

    this.floor = new Mesh(
      new PlaneGeometry(1, 1, 5, 6).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({
        color: 0xbcbcbc,
        transparent: true,
        opacity: 0.25,
      })
    )

    this.floor.scale.set(30, 30, 30)
    this.floor.position.set(0, +0.001, 0)

    this.controllerGroup = new Group()

    this.scene.add(this.marker, this.floor, this.controllerGroup)
  }

  protected buildController(data: XRInputSource): Object3D {
    let geometry, material

    switch (data.targetRayMode) {
      case 'tracked-pointer':
        geometry = new BufferGeometry()
        geometry.setAttribute(
          'position',
          new Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3)
        )
        geometry.setAttribute(
          'color',
          new Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3)
        )

        material = new LineBasicMaterial({
          vertexColors: true,
          blending: AdditiveBlending,
        })

        return new Line(geometry, material)

      case 'gaze':
        geometry = new RingGeometry(0.02, 0.04, 32).translate(0, 0, -1)
        material = new MeshBasicMaterial({
          opacity: 0.5,
          transparent: true,
        })
        return new Mesh(geometry, material)
    }
  }

  protected releaseController(data: XRInputSource) {}

  protected onSelectStart(controller: XRTargetRaySpace) {
    this._selectedController = controller
  }

  protected onSelectEnd() {
    if (this._selectedController && this._intersection) {
      this.teleport(this._intersection)
    }

    this._selectedController = null
    this._intersection = null
  }

  protected releaseControllers() {
    this.controllers.forEach((controller) => {
      controller.remove(...controller.children)
      controller.removeEventListener('selectstart', this._onSelectStart)
      controller.removeEventListener('selectend', this._onSelectEnd)
      controller.removeEventListener('connected', this._buildController)
      controller.removeEventListener('disconnected', this._releaseController)
    })

    this.controllerGroup?.remove(...this.controllerGroup.children)

    this.controllers = []
  }

  protected initControllers() {
    this.releaseControllers()

    const controllerModelFactory = new XRControllerModelFactory()

    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i)
      if (!controller) continue
      controller.addEventListener('selectstart', this._onSelectStart)
      controller.addEventListener('selectend', this._onSelectEnd)
      controller.addEventListener('connected', this._buildController)
      controller.addEventListener('disconnected', this._releaseController)
      this.controllers.push(controller)
      this.controllerGroup.add(controller)

      const controllerGrip = this.renderer.xr.getControllerGrip(i)
      controllerGrip.add(
        controllerModelFactory.createControllerModel(controllerGrip)
      )
      this.controllerGroup.add(controllerGrip)
    }
  }

  public resetPosition() {
    if (this.sessionStarted) {
      this.teleport(this.startPosition)
    }
  }

  public update() {
    if (this._selectedController) {
      this._tempMatrix
        .identity()
        .extractRotation(this._selectedController.matrixWorld)
      this.raycaster.ray.origin.setFromMatrixPosition(
        this._selectedController.matrixWorld
      )
      this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this._tempMatrix)

      const intersects = this.raycaster.intersectObjects(this.collisionObjects)
      let intersect: Intersection
      let isWall = false
      // console.log('intersects', intersects)
      if (intersects.length > 0) {
        // first found intersection hitting wall then floor
        intersect = intersects.find((intersect) =>
          intersect.object.name.includes('wall')
        )

        // console.log('intersect',intersect);

        if (!intersect) {
          intersect = intersects[0]
          isWall = false
        } else {
          isWall = true
        }

        // console.log('intersect.object.name',intersect.object.name);

        this._intersection = intersect.point

        // if intersection touch a wall, offset intersection position
        if (isWall) {
          // get normalize vector from controller position to intersection position
          const normalizeVector = this._intersection
            .clone()
            .sub(this._selectedController.position)
            .normalize()
            .negate()

          this._intersection.add(normalizeVector.multiplyScalar(0.5))
        }

        this.marker.position.copy(this._intersection)
        this.marker.position.y = 0.01
      } else {
        this._intersection = null
      }
      this.marker.visible = this._intersection !== null
    }
  }
}
