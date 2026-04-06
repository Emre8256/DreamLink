package com.example.dreamlink.Dreamlink.config;

import com.example.dreamlink.Dreamlink.dto.AuthPrincipalRecord;
import com.example.dreamlink.Dreamlink.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final AuthenticationEntryPoint authenticationEntryPoint;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        if (jwt.isBlank()) {
            SecurityContextHolder.clearContext();
            authenticationEntryPoint.commence(request, response,
                    new InvalidTokenException("Empty bearer token"));
            return;
        }

        try {
            final String userEmail = jwtService.extractUsername(jwt);

            if (userEmail == null) {
                SecurityContextHolder.clearContext();
                authenticationEntryPoint.commence(request, response,
                        new InvalidTokenException("Token does not contain a valid subject"));
                return;
            }

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    AuthPrincipalRecord principal = AuthPrincipalRecord.of(userEmail, jwt);

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            principal,
                            userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    SecurityContextHolder.clearContext();
                    authenticationEntryPoint.commence(request, response,
                            new InvalidTokenException("Token validation failed"));
                    return;
                }
            }
        } catch (AuthenticationException ex) {
            SecurityContextHolder.clearContext();
            authenticationEntryPoint.commence(request, response, ex);
            return;
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            authenticationEntryPoint.commence(request, response,
                    new InvalidTokenException("Invalid or expired token"));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static class InvalidTokenException extends AuthenticationException {
        InvalidTokenException(String msg) {
            super(msg);
        }
    }
}
