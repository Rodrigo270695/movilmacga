<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\GpsTracking;
use App\Models\WorkingSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GpsTrackingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear usuario y autenticarlo
        $this->user = User::factory()->create([
            'username' => 'testuser',
            'status' => true
        ]);

        Sanctum::actingAs($this->user);
    }

    /** @test */
    public function user_can_record_gps_location()
    {
        // Crear jornada activa
        WorkingSession::factory()->create([
            'user_id' => $this->user->id,
            'started_at' => now(),
            'ended_at' => null
        ]);

        $locationData = [
            'latitude' => -12.0464,
            'longitude' => -77.0428,
            'accuracy' => 10.5,
            'speed' => 25.0,
            'heading' => 180,
            'battery_level' => 85,
            'is_mock_location' => false
        ];

        $response = $this->postJson('/api/gps/location', $locationData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Ubicación registrada'
                ]);

        $this->assertDatabaseHas('gps_tracking', [
            'user_id' => $this->user->id,
            'latitude' => -12.0464,
            'longitude' => -77.0428,
            'accuracy' => 10.5,
            'speed' => 25.0,
            'heading' => 180,
            'battery_level' => 85,
            'is_mock_location' => false
        ]);
    }

    /** @test */
    public function user_cannot_record_location_without_active_session()
    {
        $locationData = [
            'latitude' => -12.0464,
            'longitude' => -77.0428,
            'accuracy' => 10.5
        ];

        $response = $this->postJson('/api/gps/location', $locationData);

        $response->assertStatus(400)
                ->assertJson([
                    'success' => false,
                    'message' => 'Debes iniciar una jornada laboral para registrar ubicaciones.'
                ]);
    }

    /** @test */
    public function user_can_record_batch_locations()
    {
        // Crear jornada activa
        WorkingSession::factory()->create([
            'user_id' => $this->user->id,
            'started_at' => now(),
            'ended_at' => null
        ]);

        $locations = [
            [
                'latitude' => -12.0464,
                'longitude' => -77.0428,
                'accuracy' => 10.5,
                'recorded_at' => now()->subMinutes(5)->toISOString()
            ],
            [
                'latitude' => -12.0465,
                'longitude' => -77.0429,
                'accuracy' => 12.0,
                'recorded_at' => now()->subMinutes(3)->toISOString()
            ],
            [
                'latitude' => -12.0466,
                'longitude' => -77.0430,
                'accuracy' => 8.5,
                'recorded_at' => now()->subMinute()->toISOString()
            ]
        ];

        $response = $this->postJson('/api/gps/batch-locations', [
            'locations' => $locations
        ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Ubicaciones registradas en lote',
                    'data' => [
                        'locations_count' => 3
                    ]
                ]);

        $this->assertDatabaseCount('gps_tracking', 3);
    }

    /** @test */
    public function user_can_get_today_route()
    {
        // Crear jornada activa
        WorkingSession::factory()->create([
            'user_id' => $this->user->id,
            'started_at' => now(),
            'ended_at' => null
        ]);

        // Crear ubicaciones para hoy
        GpsTracking::factory()->count(5)->create([
            'user_id' => $this->user->id,
            'recorded_at' => now()
        ]);

        $response = $this->getJson('/api/gps/my-route-today');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'date' => today()->format('Y-m-d'),
                        'locations_count' => 5
                    ]
                ]);
    }

    /** @test */
    public function validates_location_coordinates()
    {
        // Crear jornada activa
        WorkingSession::factory()->create([
            'user_id' => $this->user->id,
            'started_at' => now(),
            'ended_at' => null
        ]);

        $invalidData = [
            'latitude' => 100, // Inválido (debe estar entre -90 y 90)
            'longitude' => -77.0428,
            'accuracy' => 10.5
        ];

        $response = $this->postJson('/api/gps/location', $invalidData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['latitude']);
    }

    /** @test */
    public function validates_batch_locations_data()
    {
        // Crear jornada activa
        WorkingSession::factory()->create([
            'user_id' => $this->user->id,
            'started_at' => now(),
            'ended_at' => null
        ]);

        $invalidLocations = [
            [
                'latitude' => -12.0464,
                'longitude' => -77.0428,
                // Falta recorded_at
            ]
        ];

        $response = $this->postJson('/api/gps/batch-locations', [
            'locations' => $invalidLocations
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['locations.0.recorded_at']);
    }

    /** @test */
    public function prevents_mock_locations_from_being_recorded()
    {
        // Crear jornada activa
        WorkingSession::factory()->create([
            'user_id' => $this->user->id,
            'started_at' => now(),
            'ended_at' => null
        ]);

        $mockLocationData = [
            'latitude' => -12.0464,
            'longitude' => -77.0428,
            'accuracy' => 10.5,
            'is_mock_location' => true
        ];

        $response = $this->postJson('/api/gps/location', $mockLocationData);

        $response->assertStatus(200); // Se registra pero marcado como mock

        $this->assertDatabaseHas('gps_tracking', [
            'user_id' => $this->user->id,
            'is_mock_location' => true
        ]);
    }
}
