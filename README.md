# Disco Zombies
THREE.js mini game project for the Computer Graphics Programming AGH UST course

# Models
[Link to GDrive with models](https://drive.google.com/drive/folders/1ALt_cJLqaPVbxUsHe6bCnEL4xDIAKPfq?usp=drive_link) - due to GitHub uploads limits I couldn't attach them to repo

# Credits
- Game logic heavy inspired by SimonDev game project made with THREE.js 
- Models and animations by Adobe Mixamo
- Disco ball by Ksenia Kondrashova (https://codepen.io/ksenia-k/pen/ZEjJxWQ)


# Components

## attacker-controller.js
Contains the control logic for the attacking Entity (e.g., player character or enemy) in the game.

## entity.js
Defines classes:
- Entity: Represents an object in the game (e.g., character, enemy). It has a name, components (defining behavior), position, rotation, and parent.
- Component: Defines an aspect of the entity’s behavior. It has a parent and InitComponent (initializes the component) and Update (updates the component state) methods.
Communication between entities is done through an event system. Each event has a topic and value.

## entity-manager.js
Manages entities in the game. Allows for returning, adding, removing, updating, and filtering entities.

## finite-state-machine.js
Implements a finite state machine, which is used to model behaviors and interactions in the game.

## health-component.js
Manages the health of objects in the game, tracking the current health state and responding to damage.

## math.js
Mathematical functions used in the game, such as calculating distance, interpolation, generating random numbers, etc.

## npc-entity.js
Defines two classes: NPCFSM and NPCController, which are used to create and manage non-player characters (NPCs) in the game.

- The NPCFSM class is a state machine for NPCs
- The NPCController class is a component that manages NPCs, by handling events, loading models, animations, and tracking collisions.

## player-entity.js
Defines player classes:
- CharacterFSM: A state machine for the player, defines states such as idle, walking, running, attack, and death.
- BasicCharacterControllerProxy: A proxy for player animations.
- BasicCharacterController: The main logic and behavior of the player, loads 3D models and player animations, registers event handlers, and updates the player’s state.

## player-input.js
Allows for handling player input in the game, enabling player movement and interactions.

## player-state.js
Defines a state machine for the player character, allowing for smooth transitions between different animations and behaviors.

## spatial-grid-controller.js
Defines a class, which is a component managing a spatial grid for game objects. Allows for efficient management of a large number of objects in a game or simulation, enabling quick searching of objects near a given object.

## spatial-hash-grid.js
Defines a class, which implements a data structure known as a spatial hash grid. This is a technique used in computer games for efficient storage and searching of objects in 2D or 3D space.

## third-person-camera.js
Manages the camera from a third-person perspective, controlling its position and orientation relative to the player character.
