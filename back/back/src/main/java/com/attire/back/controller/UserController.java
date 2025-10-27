package com.attire.back.controller;

import com.attire.back.model.User;
import com.attire.back.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.findById(id);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        if (userService.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body(null);
        }

        if (user.getRole() == null || (!user.getRole().equals(User.Role.ADMIN) && !user.getRole().equals(User.Role.USER))) {
            user.setRole(User.Role.USER);
        }

        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User user) {
        Optional<User> existingUser = userService.findByEmail(user.getEmail());

        if (existingUser.isPresent() && userService.validatePassword(existingUser.get(), user.getPassword())) {
            return ResponseEntity.ok(existingUser.get());
        }

        return ResponseEntity.status(401).body("Invalid email or password");
    }

}
