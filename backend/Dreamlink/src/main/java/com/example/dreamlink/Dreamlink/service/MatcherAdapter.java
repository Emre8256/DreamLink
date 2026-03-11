package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.entity.Dream;

public interface MatcherAdapter {

    double score(Dream left, Dream right);
}
